import fs from "node:fs";
import path from "node:path";
import { createSqliteConnection } from "../src/db/client";

export function fixture(name: string) {
  return fs.readFileSync(path.join(process.cwd(), "test", "fixtures", name), "utf8");
}

export function testDb() {
  const connection = createSqliteConnection(":memory:");
  return connection;
}
