import { describe, expect, it } from "vitest";
import { addFeedSchema, articleStateSchema, zodErrorMessages } from "../src/lib/validation";

describe("Zod validation", () => {
  it("validates feed add requests", () => {
    expect(addFeedSchema.parse({ url: "https://example.com/feed.xml", category: "News" })).toEqual({
      url: "https://example.com/feed.xml",
      category: "News",
    });
  });

  it("turns an empty category into null", () => {
    expect(addFeedSchema.parse({ url: "https://example.com/feed.xml", category: "" }).category).toBeNull();
  });

  it("uses ZodError errors for readable messages", () => {
    const result = addFeedSchema.safeParse({ url: "not a url" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodErrorMessages(result.error)).toContain("Enter a valid RSS or Atom feed URL.");
    }
  });

  it("validates record-shaped article state maps", () => {
    expect(articleStateSchema.parse({ "1": true, "2": false })).toEqual({ "1": true, "2": false });
    expect(() => articleStateSchema.parse({ "1": "yes" })).toThrow();
  });
});
