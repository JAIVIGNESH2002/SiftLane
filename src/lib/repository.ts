import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { articles, feeds, type Article, type Feed, type NewArticle } from "../db/schema";
import type { SiftLaneDb } from "../db/client";
import type { ParsedFeed } from "./feed";
import { isWithinStoryWindow, stableStoryKey, titleSimilarity, titleTokens } from "./normalize";
import { nowIso } from "./time";

const PAGE_SIZE = 20;

export type TimelineFilters = {
  category?: string;
  feedId?: number;
  search?: string;
  page?: number;
};

export type ArticleGroup = {
  key: string;
  primary: Article & { feedTitle: string; feedCategory: string | null };
  articles: (Article & { feedTitle: string; feedCategory: string | null })[];
};

export async function listFeeds(db: SiftLaneDb) {
  return db.select().from(feeds).orderBy(asc(feeds.title));
}

export async function addFeedWithItems(db: SiftLaneDb, input: { url: string; category: string | null }, feed: ParsedFeed) {
  const createdAt = nowIso();
  const lastNewItemAt = newestItemDate(feed.items.map((item) => item.publishedAt));

  const [savedFeed] = await db
    .insert(feeds)
    .values({
      title: feed.title,
      url: input.url,
      siteUrl: feed.siteUrl,
      category: input.category,
      lastSuccessfulFetchAt: createdAt,
      lastNewItemAt,
      createdAt,
    })
    .returning();

  for (const item of feed.items) {
    await insertArticle(db, {
      feedId: savedFeed.id,
      title: item.title,
      url: item.url,
      normalizedUrl: item.normalizedUrl,
      author: item.author,
      description: item.description,
      imageUrl: item.imageUrl,
      publishedAt: item.publishedAt,
      fetchedAt: createdAt,
      read: false,
      saved: false,
    });
  }

  return savedFeed;
}

export async function removeFeed(db: SiftLaneDb, id: number) {
  await db.delete(feeds).where(eq(feeds.id, id));
}

export async function markFeedFailed(db: SiftLaneDb, id: number, message: string) {
  await db.update(feeds).set({ lastError: message }).where(eq(feeds.id, id));
}

export async function refreshFeedItems(db: SiftLaneDb, feed: Feed, parsedFeed: ParsedFeed) {
  const fetchedAt = nowIso();
  let added = 0;

  for (const item of parsedFeed.items) {
    const didInsert = await insertArticle(db, {
      feedId: feed.id,
      title: item.title,
      url: item.url,
      normalizedUrl: item.normalizedUrl,
      author: item.author,
      description: item.description,
      imageUrl: item.imageUrl,
      publishedAt: item.publishedAt,
      fetchedAt,
      read: false,
      saved: false,
    });
    if (didInsert) added += 1;
  }

  await db
    .update(feeds)
    .set({
      title: parsedFeed.title,
      siteUrl: parsedFeed.siteUrl,
      lastSuccessfulFetchAt: fetchedAt,
      lastNewItemAt: newestItemDate(parsedFeed.items.map((item) => item.publishedAt)) ?? feed.lastNewItemAt,
      lastError: null,
    })
    .where(eq(feeds.id, feed.id));

  return added;
}

export async function insertArticle(db: SiftLaneDb, article: NewArticle) {
  const existing = await db
    .select()
    .from(articles)
    .where(eq(articles.normalizedUrl, article.normalizedUrl))
    .limit(1);

  if (existing.length > 0) {
    return false;
  }

  const storyGroupKey = await findStoryGroupKey(db, article);
  await db.insert(articles).values({ ...article, storyGroupKey }).onConflictDoNothing();

  if (storyGroupKey) {
    await db
      .update(articles)
      .set({ storyGroupKey })
      .where(or(eq(articles.storyGroupKey, storyGroupKey), eq(articles.normalizedUrl, article.normalizedUrl)));
  }

  return true;
}

export async function getTimeline(db: SiftLaneDb, filters: TimelineFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;
  const where = buildTimelineWhere(filters);

  const rows = await db
    .select({
      article: articles,
      feedTitle: feeds.title,
      feedCategory: feeds.category,
    })
    .from(articles)
    .innerJoin(feeds, eq(articles.feedId, feeds.id))
    .where(where)
    .orderBy(desc(sql`COALESCE(${articles.publishedAt}, ${articles.fetchedAt})`))
    .limit(PAGE_SIZE)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .innerJoin(feeds, eq(articles.feedId, feeds.id))
    .where(where);

  return {
    groups: groupTimelineRows(
      rows.map((row) => ({
        ...row.article,
        feedTitle: row.feedTitle,
        feedCategory: row.feedCategory,
      })),
    ),
    page,
    pageSize: PAGE_SIZE,
    total: Number(count),
    totalPages: Math.max(1, Math.ceil(Number(count) / PAGE_SIZE)),
  };
}

export async function toggleArticleState(db: SiftLaneDb, id: number, field: "read" | "saved", value: boolean) {
  await db.update(articles).set({ [field]: value }).where(eq(articles.id, id));
}

export async function categories(db: SiftLaneDb) {
  const rows = await db
    .selectDistinct({ category: feeds.category })
    .from(feeds)
    .where(sql`${feeds.category} IS NOT NULL AND ${feeds.category} != ''`)
    .orderBy(asc(feeds.category));
  return rows.map((row) => row.category).filter((value): value is string => Boolean(value));
}

async function findStoryGroupKey(db: SiftLaneDb, article: NewArticle) {
  const candidates = await db.select().from(articles).orderBy(desc(articles.fetchedAt)).limit(200);

  for (const candidate of candidates) {
    if (titleTokens(article.title).length < 3 || titleTokens(candidate.title).length < 3) continue;
    if (!isWithinStoryWindow(article.publishedAt ?? null, candidate.publishedAt)) continue;
    if (titleSimilarity(article.title, candidate.title) < 0.33) continue;

    const key = candidate.storyGroupKey ?? stableStoryKey(candidate.title);
    await db.update(articles).set({ storyGroupKey: key }).where(eq(articles.id, candidate.id));
    return key;
  }

  return null;
}

function groupTimelineRows(rows: (Article & { feedTitle: string; feedCategory: string | null })[]) {
  const map = new Map<string, ArticleGroup>();

  for (const row of rows) {
    const key = row.storyGroupKey ?? `article:${row.id}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { key, primary: row, articles: [row] });
      continue;
    }

    existing.articles.push(row);
    if (sortArticleDate(row) > sortArticleDate(existing.primary)) {
      existing.primary = row;
    }
  }

  return Array.from(map.values()).sort((a, b) => sortArticleDate(b.primary) - sortArticleDate(a.primary));
}

function buildTimelineWhere(filters: TimelineFilters) {
  const conditions = [];
  if (filters.category) conditions.push(eq(feeds.category, filters.category));
  if (filters.feedId) conditions.push(eq(feeds.id, filters.feedId));
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(or(like(articles.title, pattern), like(articles.description, pattern)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function newestItemDate(values: (string | null)[]) {
  const sorted = values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return sorted[0] ?? null;
}

function sortArticleDate(article: Article) {
  return new Date(article.publishedAt ?? article.fetchedAt).getTime();
}
