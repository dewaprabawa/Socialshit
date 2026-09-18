# Socialshit

A marketing tool for **Instagram** and **Facebook** that can:

- **Auto-generate content** — post ideas, captions, hashtags, and images with AI.
- **Generate captions** in different tones tuned per platform and audience.
- **Connect business accounts** — Facebook Pages and Instagram Business accounts via the Meta Graph API.
- **Auto-publish & schedule** — publish immediately or schedule posts that are auto-published by a built-in scheduler.

It works out of the box with **no external credentials**: AI generation falls back to a built-in template engine, and account connection + publishing run in a **sandbox (simulated) mode**. Add API keys to switch on real AI and live publishing.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- Tailwind CSS
- Prisma ORM + SQLite
- OpenAI SDK (optional) for text & image generation
- Meta Graph API (optional) for Instagram/Facebook publishing

## Getting started

```bash
npm install          # installs deps and runs `prisma generate`
npm run db:push      # creates the SQLite schema
npm run db:seed      # (optional) seed demo accounts + a post
npm run dev          # http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env` and fill in what you need. Everything is optional
except `DATABASE_URL` (which defaults to a local SQLite file).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite connection string (default `file:./dev.db`). |
| `APP_BASE_URL` | Base URL used for OAuth redirects. |
| `OPENAI_API_KEY` | Enables real AI generation. Omit to use the offline template engine. |
| `OPENAI_TEXT_MODEL` / `OPENAI_IMAGE_MODEL` | Models used for text/image generation. |
| `META_APP_ID` / `META_APP_SECRET` | Enables real Facebook/Instagram connection + publishing. Omit for sandbox mode. |
| `META_GRAPH_VERSION` | Meta Graph API version (default `v21.0`). |

## How it works

- **Content Studio** (`/studio`) — enter a topic, brand, audience, tone, and
  platform, then generate a caption, hashtags, image, and idea suggestions.
  Publish now, schedule, or save as a draft.
- **Posts** (`/posts`) — manage drafts/scheduled/published posts, publish
  manually, or trigger the scheduler.
- **Accounts** (`/accounts`) — connect via Meta OAuth (when configured) or add
  sandbox accounts to try the full flow.

### Publishing pipeline

- **Instagram Business**: creates a media container (`/{ig-id}/media`) then
  publishes it (`/{ig-id}/media_publish`), and fetches the permalink.
- **Facebook Page**: posts a photo (`/{page-id}/photos`) or text (`/{page-id}/feed`).
- **Sandbox**: when Meta isn't configured or the account is sandboxed,
  publishing is simulated with a generated post id + permalink so the flow is
  fully demonstrable.

### Scheduler

An in-process scheduler (`src/lib/scheduler.ts`, started from
`src/instrumentation.ts`) polls every 30s for due scheduled posts and publishes
them. You can also trigger it manually from the Posts page or via
`POST /api/scheduler/tick`.
