"use client";

import { useActionState, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Feed } from "@/db/schema";
import { addFeedAction, refreshFeedAction, removeFeedAction } from "@/app/actions";
import { feedHealth } from "@/lib/feed-health";
import { formatRelativeDate } from "@/lib/time";
import { clsx } from "clsx";

export function FeedPanel({ feeds, categories }: { feeds: Feed[]; categories: string[] }) {
  const [state, formAction, pending] = useActionState(addFeedAction, {});
  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const suggestions = useMemo(
    () => Array.from(new Set([...categories, ...localCategories])).sort((a, b) => a.localeCompare(b)),
    [categories, localCategories],
  );

  useEffect(() => {
    const raw = localStorage.getItem("siftlane:categories");
    if (!raw) return;
    try {
      const values = JSON.parse(raw);
      if (Array.isArray(values)) {
        setLocalCategories(values.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      setLocalCategories([]);
    }
  }, []);

  function rememberCategory(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const category = formData.get("category")?.toString().trim();
    if (!category) return;

    const next = Array.from(new Set([category, ...localCategories])).slice(0, 20);
    localStorage.setItem("siftlane:categories", JSON.stringify(next));
    setLocalCategories(next);
  }

  return (
    <div className="ui-font flex h-full flex-col rounded-md border border-stone-200 bg-white/75 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-950/65">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-stone-950 dark:text-stone-50">Feeds</h2>
        <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-stone-400">
          Add RSS or Atom sources. Articles remain linked to their publishers.
        </p>
      </div>

      <form
        action={formAction}
        onSubmit={rememberCategory}
        className="space-y-3 border-b border-stone-200 pb-5 dark:border-stone-800"
      >
        <label className="block">
          <span className="sr-only">Feed URL</span>
          <input
            name="url"
            type="url"
            required
            placeholder="https://example.com/feed.xml"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
          />
        </label>
        <label className="block">
          <span className="sr-only">Category</span>
          <input
            name="category"
            list="siftlane-category-options"
            placeholder="Category, optional"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
          />
          <datalist id="siftlane-category-options">
            {suggestions.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="interactive w-full rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 hover:shadow-md disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-teal-200"
        >
          {pending ? "Checking feed..." : "Add feed"}
        </button>
        {state.message ? (
          <p
            className={clsx(
              "text-sm",
              state.ok ? "text-teal-700 dark:text-teal-300" : "text-red-700 dark:text-red-300",
            )}
          >
            {state.message}
          </p>
        ) : null}
      </form>

      <div className="mt-4 min-h-0 flex-1 overflow-auto">
        {feeds.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">No feeds saved yet.</p>
        ) : (
          <ul className="space-y-3">
            {feeds.map((feed) => (
              <li key={feed.id} className="border-b border-stone-100 pb-3 last:border-0 dark:border-stone-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-950 dark:text-stone-50">
                      {feed.title}
                    </p>
                    {feed.category ? (
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">{feed.category}</p>
                    ) : null}
                  </div>
                  <Health label={feedHealth(feed)} />
                </div>
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
                  Last refresh: {formatRelativeDate(feed.lastSuccessfulFetchAt)}
                </p>
                {feed.lastError ? (
                  <p className="mt-1 line-clamp-2 text-xs text-red-700 dark:text-red-300">{feed.lastError}</p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <form action={refreshFeedAction}>
                    <input type="hidden" name="id" value={feed.id} />
                    <button className="interactive rounded-md px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-50">
                      Refresh
                    </button>
                  </form>
                  <form action={removeFeedAction}>
                    <input type="hidden" name="id" value={feed.id} />
                    <button className="interactive rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 hover:text-red-900 dark:text-red-300 dark:hover:bg-red-950 dark:hover:text-red-100">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Health({ label }: { label: string }) {
  return (
    <span
      className={clsx(
        "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
        label === "healthy" && "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
        label === "stale" && "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
        label === "fetch failed" && "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
      )}
    >
      {label}
    </span>
  );
}
