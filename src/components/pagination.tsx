type Params = {
  category?: string;
  feedId?: string;
  q?: string;
};

export function Pagination({ page, totalPages, params }: { page: number; totalPages: number; params: Params }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="ui-font mt-8 flex items-center justify-between border-t border-stone-200 pt-5 text-sm dark:border-stone-800">
      <PageLink page={page - 1} disabled={page <= 1} params={params}>
        Previous
      </PageLink>
      <span className="text-stone-600 dark:text-stone-400">
        Page {page} of {totalPages}
      </span>
      <PageLink page={page + 1} disabled={page >= totalPages} params={params}>
        Next
      </PageLink>
    </nav>
  );
}

function PageLink({
  page,
  disabled,
  params,
  children,
}: {
  page: number;
  disabled: boolean;
  params: Params;
  children: React.ReactNode;
}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  search.set("page", String(page));

  if (disabled) {
    return <span className="text-stone-400 dark:text-stone-600">{children}</span>;
  }

  return (
    <a
      href={`/?${search.toString()}`}
      className="interactive rounded-md bg-stone-100 px-3 py-1.5 font-semibold text-stone-900 shadow-sm hover:bg-stone-200 hover:text-stone-950 hover:shadow-md dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 dark:hover:text-white"
    >
      {children}
    </a>
  );
}
