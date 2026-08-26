import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "siftlane.sqlite");

export function createSqliteConnection(databasePath = process.env.SIFTLANE_DATABASE_PATH ?? DEFAULT_DB_PATH) {
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  initializeDatabase(sqlite);

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
  };
}

export type SiftLaneDb = ReturnType<typeof createSqliteConnection>["db"];

let connection: ReturnType<typeof createSqliteConnection> | undefined;

export function getDb() {
  connection ??= createSqliteConnection();
  return connection.db;
}

export function initializeDatabase(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS feeds (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      title text NOT NULL,
      url text NOT NULL,
      site_url text,
      category text,
      last_successful_fetch_at text,
      last_new_item_at text,
      last_error text,
      created_at text NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS feeds_url_unique ON feeds (url);

    CREATE TABLE IF NOT EXISTS articles (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      feed_id integer NOT NULL REFERENCES feeds(id) ON DELETE cascade,
      title text NOT NULL,
      url text NOT NULL,
      normalized_url text NOT NULL,
      author text,
      description text,
      image_url text,
      published_at text,
      fetched_at text NOT NULL,
      read integer DEFAULT false NOT NULL,
      saved integer DEFAULT false NOT NULL,
      story_group_key text
    );

    CREATE UNIQUE INDEX IF NOT EXISTS articles_normalized_url_unique ON articles (normalized_url);
    CREATE INDEX IF NOT EXISTS articles_feed_id_idx ON articles (feed_id);
    CREATE INDEX IF NOT EXISTS articles_story_group_key_idx ON articles (story_group_key);
    CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles (published_at);
  `);
}
