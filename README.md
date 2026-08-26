# SiftLane

SiftLane is a calm RSS/Atom reader for following multiple sources without being overwhelmed by repeated coverage. It keeps a unified article timeline, links every article back to the original publisher, and uses deterministic Story Groups to collapse duplicate or near-duplicate coverage.

SiftLane does not scrape or republish full article content. Feed descriptions are shown only when the feed provides them, and the primary reading path always leads to the publisher.

## Features

- Add, validate, refresh, and remove RSS or Atom feeds.
- Track feed health, fetch failures, stale feeds, and last successful refresh time.
- Browse a unified paginated timeline with adaptive article cards.
- Filter by category, feed/source, or local title/description search.
- Mark articles read/unread and saved/unsaved.
- Group exact duplicate URLs and similar same-window headlines into expandable Story Groups.

## Run Locally

SiftLane intentionally targets Node `22.18.x`.

```bash
nvm use
npm ci
npm run dev
```

The app stores local SQLite data at `./data/siftlane.sqlite` by default. Set `SIFTLANE_DATABASE_PATH` to use another path.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The automated tests use small synthetic RSS/Atom fixtures and do not depend on live public feeds.

## Architecture

- Next.js App Router renders the local-first reader UI.
- SQLite stores feeds and articles.
- Drizzle ORM defines the schema and query layer.
- `rss-parser` parses RSS 2.0 and Atom XML.
- `undici` performs server-side feed fetches.
- Zod validates feed and form inputs.

Story Groups are intentionally simple and explainable. SiftLane normalizes article URLs, collapses exact duplicate normalized URLs, normalizes titles into comparable tokens, and groups sufficiently similar titles when publication dates are close enough. Users can expand each group and open every original source article.

## Maintainer Notes

Some runtime and dependency pins are deliberate:

- `clsx@2.1.0`
- `zod@3.25.76`
- `undici@7.29.0`
- Node `22.18.x` with npm engine enforcement

Do not weaken the Node runtime declaration or silently float these versions without checking why they are pinned.
