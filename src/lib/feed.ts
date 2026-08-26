import Parser from "rss-parser";
import { fetch } from "undici";
import { normalizeArticleUrl } from "./normalize";
import { parseDate } from "./time";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

export type ParsedFeedItem = {
  title: string;
  url: string;
  normalizedUrl: string;
  author: string | null;
  description: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
};

export type ParsedFeed = {
  title: string;
  siteUrl: string | null;
  items: ParsedFeedItem[];
};

type ParserItem = Parser.Item & Record<string, unknown>;

export class FeedValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedValidationError";
  }
}

export async function fetchFeedXml(url: string) {
  let response: Awaited<ReturnType<typeof fetch>>;

  try {
    response = await fetch(url, {
      headers: {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
        "user-agent": "SiftLane/0.1 (+https://github.com/openai/siftlane)",
      },
      redirect: "follow",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown network error";
    throw new FeedValidationError(`Feed request failed before a response was received: ${detail}.`);
  }

  if (!response.ok) {
    throw new FeedValidationError(`Feed request failed with HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("xml") && !contentType.includes("rss") && !contentType.includes("atom")) {
    throw new FeedValidationError("The URL did not return an RSS or Atom-like response.");
  }

  return response.text();
}

export async function parseFeedXml(xml: string): Promise<ParsedFeed> {
  let feed: Parser.Output<Record<string, unknown>>;

  try {
    feed = (await parser.parseString(xml)) as unknown as Parser.Output<Record<string, unknown>>;
  } catch {
    throw new FeedValidationError("The feed could not be parsed as RSS or Atom.");
  }

  const items = (feed.items ?? [])
    .map((item) => normalizeFeedItem(item as ParserItem, feed.link ?? null))
    .filter((item): item is ParsedFeedItem => item !== null);

  if (items.length === 0) {
    throw new FeedValidationError("The feed does not contain any linked articles.");
  }

  return {
    title: coerceText(feed.title) ?? new URL(feed.link ?? "https://example.invalid").hostname,
    siteUrl: coerceText(feed.link),
    items,
  };
}

export async function fetchAndParseFeed(url: string) {
  const xml = await fetchFeedXml(url);
  return parseFeedXml(xml);
}

function normalizeFeedItem(item: ParserItem, feedLink: string | null): ParsedFeedItem | null {
  const rawUrl = coerceText(item.link) ?? coerceText(item.guid);
  if (!rawUrl) return null;

  let url: string;
  try {
    url = new URL(rawUrl, feedLink ?? undefined).toString();
  } catch {
    return null;
  }

  const title = coerceText(item.title) ?? url;
  const description =
    coerceText(item.contentSnippet) ?? stripHtml(coerceText(item.content) ?? coerceText(item.summary));

  return {
    title,
    url,
    normalizedUrl: normalizeArticleUrl(url),
    author: coerceText(item.creator) ?? coerceText(item.author),
    description,
    imageUrl: extractImageUrl(item),
    publishedAt: parseDate(item.isoDate ?? item.pubDate),
  };
}

function extractImageUrl(item: ParserItem) {
  const enclosure = item.enclosure?.url;
  if (enclosure && looksLikeImage(enclosure)) return enclosure;

  const record = item as Record<string, unknown>;
  const mediaThumbnail = record.mediaThumbnail;
  if (isObject(mediaThumbnail) && typeof mediaThumbnail.$?.url === "string") {
    return mediaThumbnail.$.url;
  }

  const mediaContent = record.mediaContent;
  if (Array.isArray(mediaContent)) {
    for (const candidate of mediaContent) {
      if (isObject(candidate) && typeof candidate.$?.url === "string" && looksLikeImage(candidate.$.url)) {
        return candidate.$.url;
      }
    }
  }

  const html = coerceText(item.content) ?? coerceText(item.summary);
  const match = html?.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function coerceText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function stripHtml(value: string | null) {
  if (!value) return null;
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
}

function looksLikeImage(url: string) {
  return /\.(avif|gif|jpe?g|png|webp)(\?|$)/i.test(url);
}

function isObject(value: unknown): value is { $?: Record<string, string> } {
  return typeof value === "object" && value !== null;
}
