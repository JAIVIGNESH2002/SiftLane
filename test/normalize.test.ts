import { describe, expect, it } from "vitest";
import {
  isWithinStoryWindow,
  normalizeArticleUrl,
  normalizeTitle,
  stableStoryKey,
  titleSimilarity,
  titleTokens,
} from "../src/lib/normalize";

describe("normalization", () => {
  it("canonicalizes common article URL variants", () => {
    expect(
      normalizeArticleUrl("HTTPS://www.Example.com/story/?utm_source=feed&b=2&a=1#comments"),
    ).toBe("https://example.com/story?a=1&b=2");
  });

  it("normalizes titles into comparable text", () => {
    expect(normalizeTitle("Mayor's NEW plan: river-park!")).toBe("mayors new plan river park");
  });

  it("removes low-signal title tokens", () => {
    expect(titleTokens("The plan for a park in the city")).toEqual(["plan", "park", "city"]);
  });

  it("scores near-duplicate titles above unrelated titles", () => {
    const similar = titleSimilarity(
      "Mayor unveils river park plan",
      "City mayor reveals new riverfront park proposal",
    );
    const unrelated = titleSimilarity("Mayor unveils river park plan", "Scientists map coral recovery");

    expect(similar).toBeGreaterThan(0.32);
    expect(unrelated).toBeLessThan(0.2);
  });

  it("keeps story keys stable for equivalent token sets", () => {
    expect(stableStoryKey("River park plan")).toBe(stableStoryKey("Plan: river park"));
  });

  it("uses publication proximity when both dates exist", () => {
    expect(isWithinStoryWindow("2026-08-25T10:00:00Z", "2026-08-26T09:00:00Z")).toBe(true);
    expect(isWithinStoryWindow("2026-08-25T10:00:00Z", "2026-08-29T10:00:00Z")).toBe(false);
  });
});
