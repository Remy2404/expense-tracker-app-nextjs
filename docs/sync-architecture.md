# Web Sync Architecture Decision

Date: 2026-03-11

## Decision

The web app uses **Model A**:

- write path: `POST /api/sync/push`
- read path: canonical REST reads (`/api/expenses`, `/api/categories`, `/api/budgets`, `/api/dashboard/summary`, `/api/budgets/summary`)
- freshness: realtime invalidation (`sync.updated`) + SWR revalidation

`syncApi.pullChanges()` is intentionally kept as an available client API, but it is not part of the current web runtime flow.

## Why this model

- Dashboard and budget totals now come from server-side aggregate endpoints, which removes partial-list calculation errors.
- Canonical REST reads keep the web data model simpler than maintaining per-entity cursors in the browser.
- Realtime invalidation already closes most freshness gaps for web sessions.

## Why not switch to pull-delta now

- Moving to Model B on web requires cursor lifecycle, merge conflict rules, replay safety, and additional failure-state UX.
- Those changes increase complexity and risk without solving a current production blocker after the summary endpoint fixes.

## Follow-up trigger

Revisit Model B only if web needs explicit offline-first behavior, reduced payload cost at scale, or background catch-up after long disconnect windows.
