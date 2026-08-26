export const SAVED_ARTICLES_EVENT = "siftlane:savedArticlesChanged";
const SAVED_ARTICLES_KEY = "siftlane:savedArticles";

export function getSavedArticles() {
  const raw = localStorage.getItem(SAVED_ARTICLES_KEY);
  if (!raw) return new Set<string>();

  try {
    const values = JSON.parse(raw);
    if (!Array.isArray(values)) return new Set<string>();
    return new Set(values.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set<string>();
  }
}

export function setSavedArticles(savedArticles: Set<string>) {
  localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(Array.from(savedArticles)));
  window.dispatchEvent(new Event(SAVED_ARTICLES_EVENT));
}
