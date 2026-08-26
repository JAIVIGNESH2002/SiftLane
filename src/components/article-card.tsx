"use client";

import { articleStateAction } from "@/app/actions";
import { BookmarkFilledIcon, BookmarkIcon } from "@/components/icons";
import type { ArticleGroup } from "@/lib/repository";
import { getSavedArticles, setSavedArticles } from "@/lib/saved-articles";
import { formatRelativeDate } from "@/lib/time";
import { clsx } from "clsx";
import { useEffect, useState } from "react";

export function ArticleCard({ group }: { group: ArticleGroup }) {
  const article = group.primary;
  const grouped = group.articles.length > 1;
  const [saved, setSaved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const hasDescription = Boolean(article.description);

  useEffect(() => {
    setSaved(getSavedArticles().has(article.normalizedUrl));
  }, [article.normalizedUrl]);

  function toggleSaved() {
    const savedArticles = getSavedArticles();
    if (savedArticles.has(article.normalizedUrl)) {
      savedArticles.delete(article.normalizedUrl);
      setSaved(false);
    } else {
      savedArticles.add(article.normalizedUrl);
      setSaved(true);
    }
    setSavedArticles(savedArticles);
  }

  function openExcerpt() {
    setModalOpen(true);
  }

  return (
    <article
      className={clsx(
        "grid gap-5 py-7 sm:grid-cols-[1fr_auto]",
        article.read && "opacity-70",
      )}
    >
      <div className="min-w-0">
        <div className="ui-font mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
          <span className="font-medium text-stone-700 dark:text-stone-300">{article.feedTitle}</span>
          {article.author ? <span>{article.author}</span> : null}
          <time dateTime={article.publishedAt ?? article.fetchedAt}>
            {formatRelativeDate(article.publishedAt ?? article.fetchedAt)}
          </time>
          {grouped ? (
            <span className="font-medium text-teal-700 dark:text-teal-300">
              Story Group: {group.articles.length} sources
            </span>
          ) : null}
        </div>

        <h2 className="text-2xl font-semibold leading-snug text-stone-950 dark:text-stone-50">
          <button
            type="button"
            onClick={openExcerpt}
            className="text-left underline-offset-4 hover:text-teal-800 hover:underline dark:hover:text-teal-300"
          >
            {article.title}
          </button>
        </h2>

        {article.description ? (
          <div className="mt-3 max-w-3xl">
            <p className="line-clamp-3 text-base leading-7 text-stone-700 dark:text-stone-300">
              {article.description}
            </p>
          </div>
        ) : null}

        <div className="ui-font mt-4 flex flex-wrap items-center gap-4 text-sm">
          <StateButton id={article.id} field="read" active={article.read} />
          <button
            type="button"
            onClick={toggleSaved}
            className={clsx(
              "interactive inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-semibold shadow-sm",
              saved
                ? "bg-amber-100 text-amber-950 hover:bg-amber-200 dark:bg-amber-300 dark:text-stone-950 dark:hover:bg-amber-200"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-950 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 dark:hover:text-white",
            )}
          >
            {saved ? (
              <BookmarkFilledIcon className="h-4 w-4" />
            ) : (
              <BookmarkIcon className="h-4 w-4" />
            )}
            Save
          </button>
        </div>

        {grouped ? (
          <details className="ui-font mt-5">
            <summary className="cursor-pointer text-sm font-medium text-stone-700 dark:text-stone-300">
              Show all source articles
            </summary>
            <ul className="mt-3 space-y-3 border-l border-stone-200 pl-4 dark:border-stone-800">
              {group.articles.map((source) => (
                <li key={source.id} className="text-sm leading-5">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-stone-900 underline-offset-4 hover:underline dark:text-stone-100"
                  >
                    {source.title}
                  </a>
                  <span className="ml-2 text-stone-500 dark:text-stone-400">
                    {source.feedTitle} · {formatRelativeDate(source.publishedAt ?? source.fetchedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      {article.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.imageUrl}
          alt=""
          className="h-24 w-32 rounded-md object-cover sm:h-28 sm:w-40"
          loading="lazy"
        />
      ) : null}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`article-dialog-${article.id}`}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="max-h-[85dvh] w-full max-w-2xl overflow-auto rounded-md bg-white p-6 shadow-2xl dark:bg-stone-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ui-font mb-4 flex items-start justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">
                Feed excerpt
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="interactive rounded-md px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-200 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
              >
                Close
              </button>
            </div>
            <h3
              id={`article-dialog-${article.id}`}
              className="text-2xl font-semibold leading-snug text-stone-950 dark:text-stone-50"
            >
              {article.title}
            </h3>
            {hasDescription ? (
              <p className="mt-4 whitespace-pre-line text-base leading-7 text-stone-700 dark:text-stone-300">
                {article.description}
              </p>
            ) : (
              <p className="mt-4 text-base leading-7 text-stone-600 dark:text-stone-400">
                This feed item did not include an excerpt.
              </p>
            )}
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="interactive ui-font mt-6 inline-block rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 hover:shadow-md dark:bg-teal-300 dark:text-stone-950 dark:hover:bg-teal-200"
            >
              Open original article
            </a>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function StateButton({ id, field, active }: { id: number; field: "read"; active: boolean }) {
  return (
    <form action={articleStateAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(!active)} />
      <button className="interactive rounded-md bg-stone-100 px-3 py-1.5 font-semibold text-stone-700 shadow-sm hover:bg-stone-200 hover:text-stone-950 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 dark:hover:text-white">
        {active ? "Mark unread" : "Mark read"}
      </button>
    </form>
  );
}
