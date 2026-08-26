import type { Feed } from "@/db/schema";
import { filterAction } from "@/app/actions";

type Defaults = {
  category?: string;
  feedId?: string;
  q?: string;
};

export function Filters({
  feeds,
  categories,
  defaults,
}: {
  feeds: Feed[];
  categories: string[];
  defaults: Defaults;
}) {
  return (
    <form
      action={filterAction}
      className="ui-font grid gap-3 border-b border-stone-200 pb-5 dark:border-stone-800 sm:grid-cols-[1fr_12rem_12rem_auto]"
    >
      <label>
        <span className="sr-only">Search articles</span>
        <input
          name="q"
          defaultValue={defaults.q}
          placeholder="Search titles and descriptions"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
        />
      </label>
      <label>
        <span className="sr-only">Category</span>
        <select
          name="category"
          defaultValue={defaults.category ?? ""}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Feed</span>
        <select
          name="feedId"
          defaultValue={defaults.feedId ?? ""}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
        >
          <option value="">All feeds</option>
          {feeds.map((feed) => (
            <option key={feed.id} value={feed.id}>
              {feed.title}
            </option>
          ))}
        </select>
      </label>
      <button className="interactive rounded-md border border-stone-950 bg-white px-4 py-2 text-sm font-semibold text-stone-950 shadow-sm hover:border-teal-700 hover:bg-teal-50 hover:text-teal-900 hover:shadow-md dark:border-stone-200 dark:bg-stone-950 dark:text-stone-50 dark:hover:border-teal-300 dark:hover:bg-teal-950 dark:hover:text-teal-100">
        Apply
      </button>
    </form>
  );
}
