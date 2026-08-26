# AGENTS.md

## Project

SiftLane is a standalone open-source RSS/Atom reader. Keep it small, polished, deterministic, and local-first.

## Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Constraints

- Do not add AI, embeddings, vector search, queues, Redis, Docker, auth providers, or cloud services.
- Automated tests must not depend on live public feeds.
- Use Conventional Commits for repository commits.
- Keep article content limited to feed-provided metadata and link prominently to original publishers.
- Preserve the intentional Node `22.18.x` runtime and pinned `clsx`, `zod`, and `undici` dependency scenarios unless a maintainer explicitly changes the baseline.
