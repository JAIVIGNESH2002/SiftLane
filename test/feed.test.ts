import { describe, expect, it } from "vitest";
import { parseFeedXml } from "../src/lib/feed";
import { fixture } from "./helpers";

describe("feed parsing", () => {
  it("normalizes RSS 2.0 feeds and removes tracking parameters", async () => {
    const feed = await parseFeedXml(fixture("rss.xml"));

    expect(feed.title).toBe("City Desk");
    expect(feed.siteUrl).toBe("https://city.example");
    expect(feed.items).toHaveLength(2);
    expect(feed.items[0]).toMatchObject({
      title: "Library opens a new reading room",
      normalizedUrl: "https://city.example/news/library-room",
      author: "editor@city.example",
      imageUrl: "https://city.example/images/library.jpg",
      publishedAt: "2026-08-25T10:00:00.000Z",
    });
  });

  it("parses Atom feeds with authors and summaries", async () => {
    const feed = await parseFeedXml(fixture("atom.xml"));

    expect(feed.title).toBe("Science Notes");
    expect(feed.items[0]).toMatchObject({
      title: "Researchers map a small coral recovery",
      url: "https://science.example/coral-recovery",
      author: "Rina Patel",
      description: "Survey teams found new coral growth.",
    });
  });

  it("handles sparse metadata without dropping linked items", async () => {
    const feed = await parseFeedXml(fixture("sparse.xml"));

    expect(feed.items[0]).toMatchObject({
      title: "https://minimal.example/post-1",
      url: "https://minimal.example/post-1",
      author: null,
      description: null,
      imageUrl: null,
      publishedAt: null,
    });
  });

  it("rejects malformed XML", async () => {
    await expect(parseFeedXml(fixture("malformed.xml"))).rejects.toThrow(
      "could not be parsed",
    );
  });
});
