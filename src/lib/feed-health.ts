import type { Feed } from "@/db/schema";

export function feedHealth(feed: Feed) {
  if (feed.lastError) return "fetch failed";
  if (!feed.lastSuccessfulFetchAt) return "fetch failed";
  const last = feed.lastNewItemAt ?? feed.lastSuccessfulFetchAt;
  const age = Date.now() - new Date(last).getTime();
  if (!Number.isNaN(age) && age > 1000 * 60 * 60 * 24 * 30) return "stale";
  return "healthy";
}
