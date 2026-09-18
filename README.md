# Socialshit

A marketing tool for **Instagram** and **Facebook** that can:

- **Auto-generate content** — post ideas, captions, hashtags, and images with AI.
- **Generate captions** in different tones tuned per platform and audience.
- **Design with Canva** — create an editable Canva design from your post content and import the exported image (Canva Connect API, with an offline sandbox fallback).
- **Real image uploads** — upload an image file (PNG/JPG/WEBP/GIF) or paste a URL or generate one.
- **Sign in with Facebook or Instagram** — Facebook Login and Instagram Login (sandbox login when Meta keys are not set).
- **Connect business accounts** — a guided wizard connects Facebook Pages and Instagram Business accounts via the Meta Graph API (OAuth, manual token, or sandbox).
- **Auto-publish & schedule** — publish immediately or schedule posts that are auto-published by a built-in scheduler.

It works out of the box with **no external credentials**: sign in with sandbox Facebook/Instagram buttons, AI generation falls back to a built-in template engine, and account connection + publishing run in a **sandbox (simulated) mode**. Add API keys to switch on real login, AI, and live publishing.

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
| `META_APP_ID` / `META_APP_SECRET` | Enables Facebook Login, Instagram Login, real Page/IG connection, and publishing. Omit for sandbox login + sandbox publishing. |
| `META_LOGIN_CONFIG_ID` | Facebook Login for Business configuration ID used by Connect Pages. Avoids Invalid Scopes on consumer Facebook Login. |
| `META_GRAPH_VERSION` | Meta Graph API version (default `v21.0`). |
| `CANVA_CLIENT_ID` / `CANVA_CLIENT_SECRET` | Enables live Canva design creation + export. Omit for sandbox designs. |
| `PRIVACY_CONTACT_EMAIL` | Optional email shown on `/privacy`. |

## Deploying to Vercel

The GitHub repo is named `Socialshit`. Vercel **project names cannot have uppercase letters**, so the import form will fail if you leave the default name.

**On the Vercel import screen, change Project Name from `Socialshit` to `socialshit`, then click Deploy.**

Allowed characters: lowercase letters, digits, `.`, `_`, `-` (max 100). `package.json` and `vercel.json` already use `socialshit`.

Then:

1. **Add a Postgres database** — Vercel Storage → Postgres (or Neon) and set `DATABASE_URL`. The build runs `prisma migrate deploy` via `vercel-build`.
2. **Enable uploads (optional)** — add a Vercel Blob store (`BLOB_READ_WRITE_TOKEN`).
3. **Scheduler** — `vercel.json` hits `/api/scheduler/tick` once a day (Hobby-plan limit). Upgrade Vercel or call that endpoint yourself for more frequent publishes.
4. **Facebook / Instagram Login** — set `META_APP_ID`, `META_APP_SECRET`, and `APP_BASE_URL=https://your-app.vercel.app`, then Redeploy. Add `https://your-app.vercel.app/api/auth/facebook/callback` (and the Instagram callback) under Valid OAuth Redirect URIs. For Connect Pages, add Facebook Login for Business, create a User access token configuration, and set `META_LOGIN_CONFIG_ID`. Without Meta keys, Continue with Facebook uses a sandbox session (no 500). Without `DATABASE_URL`, login is stored in a signed cookie so the button still works.

CLI: `npx vercel --prod --name socialshit --yes` (or `npm run deploy`).

## Connect Facebook Developer (real login)

Until `META_APP_ID` and `META_APP_SECRET` are set, **Continue with Facebook / Instagram** creates a sandbox session. To use real Facebook Login and Instagram Login:

1. Open [Meta for Developers](https://developers.facebook.com/apps/) and create an app (Business, or the “Authenticate and request data from users with Facebook Login” use case).
2. Add **Facebook Login**. In the current dashboard: **Use cases → Authentication and Account Creation → Customize → Go to settings**.
3. Enable **Client OAuth login** and **Web OAuth login**. Add these **Valid OAuth Redirect URIs** (no trailing slash):

```
{APP_BASE_URL}/api/auth/facebook/callback
{APP_BASE_URL}/api/auth/instagram/callback
```

Examples:

```
http://localhost:3000/api/auth/facebook/callback
http://localhost:3000/api/auth/instagram/callback
```

4. For Instagram Login, add the **Instagram** product → **API setup with Instagram login**, and paste the Instagram callback. The Instagram account must be Professional (Business or Creator).
5. **App settings → Basic**: copy App ID and App Secret into `.env` (local) or Vercel **Environment Variables** (production):

```
META_APP_ID=...
META_APP_SECRET=...
META_LOGIN_CONFIG_ID=...
APP_BASE_URL=http://localhost:3000
```

On Vercel, `APP_BASE_URL` must be your public HTTPS origin, for example `https://socialshit-dev-1.vercel.app`. Redeploy after saving.

6. Add `localhost` (and your production domain) under **App domains**.
7. Development-mode apps only allow **Admins / Developers / Testers**. Add yourself under **App roles** and accept the invite. If Facebook says **Aplikasi ini tidak bisa diakses sekarang** / the app will be reactivated later, the Facebook account you are using is not a role on the app, Facebook Login is missing, or the app is switched off. Live mode is not required.
8. Restart `npm run dev` (or wait for the Vercel redeploy). Reload `/login` — the sandbox note should disappear. Click **Continue with Facebook**.
9. After you are signed in, go to **Accounts → Add integration → Connect with Meta** to attach Facebook Pages and linked Instagram Business accounts for publishing.
10. **Invalid Scopes** on Connect Pages: consumer Facebook Login cannot request Page/IG publishing permissions until they are added. Add **Facebook Login for Business** → **Configurations** → User access token with the publishing permissions below, copy the Config ID into `META_LOGIN_CONFIG_ID`, Redeploy. Or add each permission under **App Review → Permissions and Features** (Development testers can use them without submitting review).

Permissions this app requests:

- Login: `public_profile` plus `pages_show_list` (Facebook Login for Business requires at least one permission besides public_profile) and `instagram_business_basic`, `instagram_business_content_publish` (Instagram).
- Publishing (Connect with Meta): `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management` — via Facebook Login for Business `config_id`, not as consumer Facebook Login scopes.

Going **Live** later requires a **Privacy Policy URL** and Meta App Review for those publishing permissions. Testers can use the app while it stays in Development.

Public legal URLs (no login required):

```
{APP_BASE_URL}/privacy
{APP_BASE_URL}/privacy#data-deletion
```

Examples:

```
http://localhost:3000/privacy
https://socialshit-dev-1.vercel.app/privacy
```

In the Meta app: **App settings → Basic → Privacy Policy URL**, and **User data deletion** → Data deletion instructions URL (`/privacy#data-deletion`). Optional: set `PRIVACY_CONTACT_EMAIL` so a contact address appears on the policy page.

## How it works

- **Content Studio** (`/studio`) — enter a topic, brand, audience, tone, and
  platform, then generate a caption, hashtags, image, and idea suggestions.
  Publish now, schedule, or save as a draft.
- **Posts** (`/posts`) — manage drafts/scheduled/published posts, publish
  manually, or trigger the scheduler.
- **Login** (`/login`) — Continue with Facebook or Continue with Instagram.
  With Meta keys, that is real OAuth. Without them, sandbox sessions are created
  so you can use the rest of the app.
- **Accounts** (`/accounts`) — connect via Meta OAuth (when configured) or add
  sandbox accounts to try the full flow. Accounts are scoped to the signed-in user.

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
