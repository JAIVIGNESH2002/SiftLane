import crypto from "node:crypto";

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

const TITLE_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "new",
  "says",
]);

export function normalizeArticleUrl(input: string) {
  const url = new URL(input);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.protocol = url.protocol.toLowerCase();

  for (const key of Array.from(url.searchParams.keys())) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  const sorted = Array.from(url.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
  url.search = "";
  for (const [key, value] of sorted) {
    url.searchParams.append(key, value);
  }

  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

export function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleTokens(title: string) {
  return normalizeTitle(title)
    .replace(/\briverfront\b/g, "river front")
    .split(" ")
    .filter((token) => token.length > 2 && !TITLE_STOPWORDS.has(token));
}

export function titleSimilarity(first: string, second: string) {
  const a = new Set(titleTokens(first));
  const b = new Set(titleTokens(second));
  if (a.size === 0 || b.size === 0) return 0;

  const intersection = Array.from(a).filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

export function stableStoryKey(title: string) {
  const tokens = titleTokens(title).sort().join(" ");
  const digest = crypto.createHash("sha1").update(tokens || normalizeTitle(title)).digest("hex").slice(0, 12);
  return `story:${digest}`;
}

export function isWithinStoryWindow(first: string | null, second: string | null, hours = 48) {
  if (!first || !second) return true;
  const a = new Date(first).getTime();
  const b = new Date(second).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return true;
  return Math.abs(a - b) <= hours * 60 * 60 * 1000;
}
