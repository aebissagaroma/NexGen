# ELECTROCUP 26 — Web Deployment

Deploy guide for the **Next.js 14 web app** (`electrocup/`). This is the whole
platform *and* the backend the mobile app talks to — see
[`electrocup-mobile/DEPLOYMENT.md`](../electrocup-mobile/DEPLOYMENT.md) for the app.

---

## 1. Architecture — it's one deployment

This is a **single Next.js App Router codebase**. The pages *and* the API routes
(`src/app/api/*`) ship as **one deployment** — there is no separate backend
service. So the production topology is two tiers, not three:

| Tier | Host | What runs there |
|------|------|-----------------|
| App (frontend **+** API routes) | **Vercel** | SSR pages + all `/api/*` endpoints |
| Database | **Neon** (serverless Postgres) | the `electrocup` database |

> Neon is chosen because it has a built-in connection pooler — the raw `pg` pool
> (`src/lib/db.ts`) is safe against Vercel's serverless functions when you use
> Neon's **pooled** connection string.
>
> **Alternative:** host the whole app *and* Postgres on **Render** via the
> included `render.yaml` blueprint (it auto-runs migrate + seed on deploy). If you
> go that route you don't use Vercel or Neon. Pick one topology, not both.

---

## 2. Environment variables

Set these in the Vercel project (**Settings → Environment Variables**, Production).
Locally they live in `.env.local` (Next) / `.env` (the `db:*` CLI scripts) — both
are gitignored.

| Variable | Required | Notes |
|----------|:--------:|-------|
| `DATABASE_URL` | ✅ | Neon **pooled** connection string (host contains `-pooler`). |
| `PGSSL` | ✅ | `true` for Neon/managed Postgres. |
| `SESSION_SECRET` | ✅ | 32-byte random; signs session cookies. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Use a **fresh** value in prod. |
| `ADMIN_EMAIL` | ✅ | Admin dashboard login. |
| `ADMIN_PASSWORD` | ✅ | Change from any placeholder before launch. |
| `SMTP_HOST` | ⛔️ optional | **Unset = dev mode** (OTP code returned in the API response, no email sent). Set it to send real OTP emails. |
| `SMTP_PORT` | ⛔️ | `587` (STARTTLS) or `465` (implicit TLS). Default `587`. |
| `SMTP_USER` | ⛔️ | SMTP username. |
| `SMTP_PASS` | ⛔️ | SMTP password / app password / API key. |
| `SMTP_FROM` | ⛔️ | From header, e.g. `ELECTROCUP <no-reply@yourdomain.com>`. |

> ⚠️ In production (`NODE_ENV=production`, which Vercel sets automatically),
> dev mode is disabled: if `SMTP_HOST` is **unset**, users request a code but
> never receive one — **registration will not work**. You must set the SMTP vars
> before real users can register. See step 5.

---

## 3. Create the database (Neon)

1. [neon.tech](https://neon.tech) → **New Project** → name it, pick a region near your users.
2. Copy the **Pooled** connection string (Dashboard → Connection Details →
   toggle **Pooled connection**). It looks like
   `postgres://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`.

---

## 4. Apply schema + seed

The app ships an idempotent schema (`db/schema.sql`) and seeds the 20 clubs
(`db/seed.sql`). Run this **once** from your machine against the Neon DB:

```bash
cd electrocup
DATABASE_URL="<neon-pooled-url>" PGSSL=true npm run db:reset   # = migrate + seed
```

> `schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so it will **not** alter an
> existing table whose columns changed. Run this against a **fresh** database. If
> you ever need to rebuild an existing one:
> `psql "<url>" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"` then
> `npm run db:reset` again.

---

## 5. Deploy to Vercel

1. Push the repo to GitHub (already remotes to `aebissagaroma/NexGen`).
2. [vercel.com](https://vercel.com) → **New Project** → import the repo. Framework
   auto-detects as **Next.js**; the build command (`next build`) is already set in
   `vercel.json`. Root directory = the `electrocup/` folder.
3. Add all Production env vars from §2.
4. **Deploy.** You get `https://<project>.vercel.app`.

> **Build note:** `next.config.mjs` sets `typescript.ignoreBuildErrors` and
> `eslint.ignoreDuringBuilds` because the ported marketing/"Tweaks" design
> components carry loose types. This lets the build pass. To restore strict
> build-time checking, tighten types in
> `src/components/landing/{Landing,TweaksPanel}.tsx` and remove those two flags.

---

## 6. Turn on real OTP emails (SMTP)

Registration is gated on an emailed 6-digit code. Wire any SMTP provider by
setting the `SMTP_*` vars (§2). Two easy free options:

**Gmail**
- Enable 2FA on the Google account, then create an **App Password**
  (Google Account → Security → App passwords).
- `SMTP_HOST=smtp.gmail.com` · `SMTP_PORT=587` · `SMTP_USER=you@gmail.com`
  · `SMTP_PASS=<app password>` · `SMTP_FROM=ELECTROCUP <you@gmail.com>`

**Brevo** (better deliverability for transactional mail, 300/day free)
- `SMTP_HOST=smtp-relay.brevo.com` · `SMTP_PORT=587`
  · `SMTP_USER=<brevo login>` · `SMTP_PASS=<SMTP key>`
  · `SMTP_FROM=ELECTROCUP <verified-sender@yourdomain.com>`

Redeploy (or just save env vars and redeploy) after setting these.

---

## 7. Verify the deployment

1. Open the Vercel URL — landing, `/standings`, `/bracket`, `/prize` render.
2. `/register` → enter a **real email** → confirm the code arrives → finish the
   entry → "YOU'RE IN."
3. **Admin dashboard:** `/dashboard` → sign in with `ADMIN_EMAIL` /
   `ADMIN_PASSWORD`. You should see the registration, be able to change
   payment/status inline, and export CSV.

---

## 8. Auth & registration model (reference)

- **Players:** passwordless **email OTP**. `POST /api/auth/otp/request` emails a
  code; `POST /api/auth/otp/verify` checks it, upserts the user, and issues a
  session. Web uses an httpOnly cookie; the verify response **also returns a
  `token`** in the body so the native app can persist the session.
- **Admin:** single env credential (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) via
  `POST /api/admin/login`.
- **Sessions:** stateless signed cookies (HMAC-SHA256), no session table.

---

## 9. Redeploys & migrations

- **Code changes:** push to the deployed branch → Vercel auto-builds.
- **Schema changes:** `db/schema.sql` is the source of truth but only *creates*
  missing objects. For column/table changes on a live DB, run the ALTER manually
  (or use a migration tool) — the `db:migrate` script does not diff.

---

## 10. Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Users request a code but never get it in prod | `SMTP_HOST` unset → wire SMTP (§6). |
| `password authentication failed` at build/seed | Wrong `DATABASE_URL`, or missing `?sslmode=require` / `PGSSL=true`. |
| `too many connections` under load | Use Neon's **pooled** string (host has `-pooler`). |
| Build fails on type errors | Confirm the two `ignore*` flags in `next.config.mjs` are present. |
| Admin login fails | `ADMIN_EMAIL`/`ADMIN_PASSWORD` not set in Vercel env. |

---

## Still owned by the developer (search `TODO(dev)`)

Registration fields, payment gateway, multi-admin, and bracket/standings
ingestion remain open — see the main `README.md` and inline `TODO(dev)` markers.
