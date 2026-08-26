import { afterEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("undici", () => ({
  fetch: fetchMock,
}));

describe("feed fetching", () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it("rejects failed HTTP responses", async () => {
    const { fetchFeedXml } = await import("../src/lib/feed");
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers({ "content-type": "application/rss+xml" }),
    });

    await expect(fetchFeedXml("https://example.com/rss")).rejects.toThrow("HTTP 503");
  });

  it("explains transport-level fetch failures", async () => {
    const { fetchFeedXml } = await import("../src/lib/feed");
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(fetchFeedXml("https://example.com/rss")).rejects.toThrow(
      "before a response was received: fetch failed",
    );
  });

  it("rejects non-feed content types", async () => {
    const { fetchFeedXml } = await import("../src/lib/feed");
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/html" }),
      text: async () => "<html></html>",
    });

    await expect(fetchFeedXml("https://example.com/rss")).rejects.toThrow("RSS or Atom-like");
  });
});
