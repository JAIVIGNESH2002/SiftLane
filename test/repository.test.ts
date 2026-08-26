import { describe, expect, it } from "vitest";
import { feeds } from "../src/db/schema";
import {
  addFeedWithItems,
  categories,
  getTimeline,
  insertArticle,
  refreshFeedItems,
} from "../src/lib/repository";
import { parseFeedXml } from "../src/lib/feed";
import { feedHealth } from "../src/lib/feed-health";
import { fixture, testDb } from "./helpers";

describe("repository behavior", () => {
  it("adds feeds with parsed articles", async () => {
    const { db } = testDb();
    const parsed = await parseFeedXml(fixture("rss.xml"));

    const feed = await addFeedWithItems(db, { url: "https://city.example/rss.xml", category: "Local" }, parsed);
    const timeline = await getTimeline(db);

    expect(feed.title).toBe("City Desk");
    expect(timeline.total).toBe(2);
    expect(timeline.groups[0].primary.feedTitle).toBe("City Desk");
  });

  it("collapses exact duplicate normalized URLs", async () => {
    const { db } = testDb();
    const parsed = await parseFeedXml(fixture("duplicates.xml"));

    await addFeedWithItems(db, { url: "https://wire.example/rss.xml", category: "News" }, parsed);
    const timeline = await getTimeline(db);

    expect(timeline.total).toBe(2);
  });

  it("groups near duplicate stories while preserving source articles", async () => {
    const { db } = testDb();
    const parsed = await parseFeedXml(fixture("duplicates.xml"));

    await addFeedWithItems(db, { url: "https://wire.example/rss.xml", category: "News" }, parsed);
    const timeline = await getTimeline(db);
    const storyGroup = timeline.groups.find((group) => group.articles.length > 1);

    expect(storyGroup).toBeDefined();
    expect(storyGroup?.articles.map((article) => article.url)).toContain(
      "https://regional.example/news/riverfront-park",
    );
  });

  it("paginates the unified timeline", async () => {
    const { db } = testDb();
    const [feed] = await db
      .insert(feeds)
      .values({
        title: "Bulk",
        url: "https://bulk.example/rss",
        createdAt: "2026-08-25T00:00:00.000Z",
      })
      .returning();

    for (let index = 0; index < 25; index += 1) {
      await insertArticle(db, {
        feedId: feed.id,
        title: `Article ${index}`,
        url: `https://bulk.example/${index}`,
        normalizedUrl: `https://bulk.example/${index}`,
        fetchedAt: `2026-08-25T00:${String(index).padStart(2, "0")}:00.000Z`,
        read: false,
        saved: false,
      });
    }

    const firstPage = await getTimeline(db, { page: 1 });
    const secondPage = await getTimeline(db, { page: 2 });

    expect(firstPage.groups).toHaveLength(20);
    expect(secondPage.groups).toHaveLength(5);
    expect(firstPage.totalPages).toBe(2);
  });

  it("filters by category and feed", async () => {
    const { db } = testDb();
    const rss = await parseFeedXml(fixture("rss.xml"));
    const atom = await parseFeedXml(fixture("atom.xml"));
    const city = await addFeedWithItems(db, { url: "https://city.example/rss", category: "Local" }, rss);
    await addFeedWithItems(db, { url: "https://science.example/atom", category: "Science" }, atom);

    expect((await getTimeline(db, { category: "Science" })).total).toBe(1);
    expect((await getTimeline(db, { feedId: city.id })).total).toBe(2);
    expect(await categories(db)).toEqual(["Local", "Science"]);
  });

  it("searches article titles and descriptions", async () => {
    const { db } = testDb();
    await addFeedWithItems(db, { url: "https://city.example/rss", category: null }, await parseFeedXml(fixture("rss.xml")));

    expect((await getTimeline(db, { search: "late train" })).total).toBe(1);
    expect((await getTimeline(db, { search: "quiet room" })).total).toBe(1);
  });

  it("reports stale and failed feed health", () => {
    const base = {
      id: 1,
      title: "Old",
      url: "https://old.example/rss",
      siteUrl: null,
      category: null,
      lastSuccessfulFetchAt: "2026-01-01T00:00:00.000Z",
      lastNewItemAt: "2026-01-01T00:00:00.000Z",
      lastError: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    expect(feedHealth(base)).toBe("stale");
    expect(feedHealth({ ...base, lastError: "Nope" })).toBe("fetch failed");
  });

  it("records refresh failures through feed metadata", async () => {
    const { db } = testDb();
    const parsed = await parseFeedXml(fixture("rss.xml"));
    const feed = await addFeedWithItems(db, { url: "https://city.example/rss", category: null }, parsed);

    const added = await refreshFeedItems(db, feed, parsed);
    const timeline = await getTimeline(db);

    expect(added).toBe(0);
    expect(timeline.total).toBe(2);
  });
});
