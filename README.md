# SocialHack

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

The product name is **SocialHack**. The GitHub repo may still be named `Socialshit` / `socialshit-dev-1`. Vercel **project names cannot have uppercase letters**, so the import form will fail if you leave a mixed-case default.

**On the Vercel import screen, use project name `socialshit` (or `socialhack`), then click Deploy.**

Allowed characters: lowercase letters, digits, `.`, `_`, `-` (max 100). `package.json` and `vercel.json` already use `socialshit`.

Then:

1. **Add a Postgres database** — Vercel Storage → Postgres (or Neon) and set `DATABASE_URL`. The build runs `prisma migrate deploy` via `vercel-build`.
2. **Enable uploads (optional)** — add a Vercel Blob store (`BLOB_READ_WRITE_TOKEN`).
3. **Scheduler** — `vercel.json` hits `/api/scheduler/tick` once a day (Hobby-plan limit). Upgrade Vercel or call that endpoint yourself for more frequent publishes.
4. **Facebook / Instagram Login** — set `META_APP_ID`, `META_APP_SECRET`, and `APP_BASE_URL=https://your-app.vercel.app`, then Redeploy. Add `https://your-app.vercel.app/api/auth/facebook/callback` under Facebook Login, and `https://your-app.vercel.app/api/auth/instagram/callback` under Instagram → API setup with Instagram login. `META_LOGIN_CONFIG_ID` is optional (Facebook Pages / Login for Business only). Without Meta keys, Continue with Facebook uses a sandbox session (no 500). Without `DATABASE_URL`, login is stored in a signed cookie so the button still works.

CLI: `npx vercel --prod --name socialshit --yes` (or `npm run deploy`).

## How Meta’s business APIs work

Meta ships several APIs. SocialHack uses them separately so a personal Facebook account does **not** have to join Business Manager.

### 1. Instagram API with Instagram Login (recommended business API)

This is the Instagram publishing API that does **not** need a Facebook Page or a Business portfolio.

| Step | Endpoint |
| --- | --- |
| Authorize | `https://www.instagram.com/oauth/authorize` |
| Short-lived token | `https://api.instagram.com/oauth/access_token` |
| Long-lived token | `https://graph.instagram.com/{version}/access_token?grant_type=ig_exchange_token` |
| Profile + publish | `https://graph.instagram.com/{version}` (`/me`, `/{ig-user-id}/media`, `/{ig-user-id}/media_publish`) |

Scopes: `instagram_business_basic`, `instagram_business_content_publish`.

In this app: **Continue with Instagram** and **Accounts → Instagram → Connect with Meta** (`/api/auth/instagram`). The Instagram account must be Professional (Business or Creator). Add the **Instagram** product → **API setup with Instagram login**, paste the Instagram callback, and add the IG username as a tester.

### 2. Facebook Login (identity only)

**Continue with Facebook** uses consumer Facebook Login with `public_profile` only. No `config_id`, no Page scopes. This signs a person in. It does not list Pages.

### 3. Facebook Graph API for Pages (optional)

Publishing to a Facebook Page needs a Page you admin and a Page access token (`/{page-id}/photos` or `/{page-id}/feed` on `graph.facebook.com`). Ways to get that token:

- Paste a long-lived Page token from [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- **Accounts → Facebook Page → Connect with Meta** (`/api/auth/meta`), which uses Facebook Login for Business when `META_LOGIN_CONFIG_ID` is set

Facebook Login for Business requires a Business portfolio. Skip it if you only want Instagram publishing.

### 4. Instagram Graph API via a Page (legacy, optional)

If an Instagram Professional account is linked to a Facebook Page, Connect Pages can import that IG account and publish with the Page token on `graph.facebook.com`. Instagram Login above is the path that avoids Business Manager.

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

4. For **Instagram API with Instagram Login**, add the **Instagram** product → **API setup with Instagram login**, paste the Instagram callback, and add your Instagram username as a tester. Convert the IG account to Professional (Business or Creator). No Facebook Page and no Business Manager.
5. **App settings → Basic**: copy App ID and App Secret into `.env` (local) or Vercel **Environment Variables** (production):

```
META_APP_ID=...
META_APP_SECRET=...
APP_BASE_URL=http://localhost:3000
```

`META_LOGIN_CONFIG_ID` is only for Facebook Pages via Login for Business. Leave it unset for Instagram Login.

On Vercel, `APP_BASE_URL` must be your public HTTPS origin, for example `https://socialshit-dev-1.vercel.app`. Redeploy after saving.

6. Add `localhost` (and your production domain) under **App domains**.
7. Development-mode apps only allow **Admins / Developers / Testers**. Add yourself under **App roles** and accept the invite. For Instagram Login also add the IG username as an Instagram tester. If Facebook says **Aplikasi ini tidak bisa diakses sekarang** / the app will be reactivated later, the Facebook account you are using is not a role on the app, Facebook Login is missing, or the app is switched off. Live mode is not required.
8. Restart `npm run dev` (or wait for the Vercel redeploy). Reload `/login` — the sandbox note should disappear. Click **Continue with Instagram** to use the business publishing API, or **Continue with Facebook** to sign in with a personal account.
9. Optional Facebook Pages: **Accounts → Add integration → Facebook Page → Connect with Meta**, or paste a Page access token. Instagram publishing should use Instagram Login instead of linking your personal Facebook to Business Manager.

Permissions this app requests:

- Facebook sign-in: `public_profile` only (personal Facebook; no Business portfolio).
- Instagram Login (business API): `instagram_business_basic`, `instagram_business_content_publish`.
- Optional Facebook Pages: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management` — via Facebook Login for Business `config_id`, not as consumer Facebook Login scopes.

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

- **Instagram (Instagram Login)**: `graph.instagram.com` — create a media container (`/{ig-user-id}/media`) then publish it (`/{ig-user-id}/media_publish`). Page-linked IG tokens fall back to `graph.facebook.com`.
- **Facebook Page**: `graph.facebook.com` — photo (`/{page-id}/photos`) or text (`/{page-id}/feed`).
- **Facebook Page**: posts a photo (`/{page-id}/photos`) or text (`/{page-id}/feed`).
- **Sandbox**: when Meta isn't configured or the account is sandboxed,
  publishing is simulated with a generated post id + permalink so the flow is
  fully demonstrable.

### Scheduler

An in-process scheduler (`src/lib/scheduler.ts`, started from
`src/instrumentation.ts`) polls every 30s for due scheduled posts and publishes
them. You can also trigger it manually from the Posts page or via
`POST /api/scheduler/tick`.
