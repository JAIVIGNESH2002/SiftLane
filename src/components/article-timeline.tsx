"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ArticleCard } from "@/components/article-card";
import { BookmarkFilledIcon, BookmarkIcon } from "@/components/icons";
import type { ArticleGroup } from "@/lib/repository";
import { getSavedArticles, SAVED_ARTICLES_EVENT } from "@/lib/saved-articles";

export function ArticleTimeline({ groups }: { groups: ArticleGroup[] }) {
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    function syncSavedArticles() {
      setSavedArticles(getSavedArticles());
    }

    syncSavedArticles();
    window.addEventListener(SAVED_ARTICLES_EVENT, syncSavedArticles);
    window.addEventListener("storage", syncSavedArticles);
    return () => {
      window.removeEventListener(SAVED_ARTICLES_EVENT, syncSavedArticles);
      window.removeEventListener("storage", syncSavedArticles);
    };
  }, []);

  const visibleGroups = useMemo(() => {
    if (!savedOnly) return groups;
    return groups.filter((group) =>
      group.articles.some((article) => savedArticles.has(article.normalizedUrl)),
    );
  }, [groups, savedArticles, savedOnly]);

  return (
    <>
      <div className="ui-font mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {savedOnly ? "Showing saved articles" : "Showing latest articles"}
        </p>
        <button
          type="button"
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly((value) => !value)}
          className={clsx(
            "interactive inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm",
            savedOnly
              ? "bg-amber-100 text-amber-950 hover:bg-amber-200 dark:bg-amber-300 dark:text-stone-950"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-950 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 dark:hover:text-white",
          )}
        >
          {savedOnly ? (
            <BookmarkFilledIcon className="h-4 w-4" />
          ) : (
            <BookmarkIcon className="h-4 w-4" />
          )}
          Saved
        </button>
      </div>

      <div className="mt-4 divide-y divide-stone-200 dark:divide-stone-800">
        {visibleGroups.length > 0 ? (
          visibleGroups.map((group) => <ArticleCard key={group.key} group={group} />)
        ) : (
          <div className="py-20 text-center">
            <h2 className="text-xl font-medium text-stone-950 dark:text-stone-50">
              {savedOnly ? "No saved articles yet." : "No articles here yet."}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-stone-600 dark:text-stone-400">
              {savedOnly ? "Save an article to keep it in this browser." : "Add a feed, clear the filters, or try a broader search."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
