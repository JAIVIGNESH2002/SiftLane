import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const feeds = sqliteTable(
  "feeds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    siteUrl: text("site_url"),
    category: text("category"),
    lastSuccessfulFetchAt: text("last_successful_fetch_at"),
    lastNewItemAt: text("last_new_item_at"),
    lastError: text("last_error"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    urlIdx: uniqueIndex("feeds_url_unique").on(table.url),
  }),
);

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    normalizedUrl: text("normalized_url").notNull(),
    author: text("author"),
    description: text("description"),
    imageUrl: text("image_url"),
    publishedAt: text("published_at"),
    fetchedAt: text("fetched_at").notNull(),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    saved: integer("saved", { mode: "boolean" }).notNull().default(false),
    storyGroupKey: text("story_group_key"),
  },
  (table) => ({
    normalizedUrlIdx: uniqueIndex("articles_normalized_url_unique").on(table.normalizedUrl),
  }),
);

export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
