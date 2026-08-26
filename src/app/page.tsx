import { getDb } from "@/db/client";
import { ArticleTimeline } from "@/components/article-timeline";
import { FeedPanel } from "@/components/feed-panel";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { ThemeToggle } from "@/components/theme-toggle";
import { categories, getTimeline, listFeeds } from "@/lib/repository";

type SearchParams = {
  category?: string;
  feedId?: string;
  q?: string;
  page?: string;
};

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const db = getDb();
  const [feeds, feedCategories, timeline] = await Promise.all([
    listFeeds(db),
    categories(db),
    getTimeline(db, {
      category: params.category,
      feedId: params.feedId ? Number(params.feedId) : undefined,
      search: params.q,
      page: params.page ? Number(params.page) : 1,
    }),
  ]);

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 gap-10 px-5 py-6 md:grid-cols-[19rem_1fr] md:px-8 lg:py-10">
      <aside className="md:sticky md:top-8 md:h-[calc(100dvh-4rem)]">
        <FeedPanel feeds={feeds} categories={feedCategories} />
      </aside>

      <section className="min-w-0">
        <header className="mb-8 border-b border-stone-200 pb-7 dark:border-stone-800">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-5xl font-bold leading-none text-stone-950 dark:text-stone-50">
                SiftLane
              </p>
            </div>
            <ThemeToggle />
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-stone-950 dark:text-stone-50 sm:text-4xl">
            Follow many feeds without reading the same story five times.
          </h1>
        </header>

        <Filters feeds={feeds} categories={feedCategories} defaults={params} />

        <ArticleTimeline groups={timeline.groups} />

        <Pagination
          page={timeline.page}
          totalPages={timeline.totalPages}
          params={{ category: params.category, feedId: params.feedId, q: params.q }}
        />
      </section>
    </main>
  );
}
