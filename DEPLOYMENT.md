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
| `PGSSL` | ✅ | `true` for Neon (TLS **with certificate verification**). `no-verify` only for self-signed chains (Render internal). `false` = plain, local dev only. |
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

Registration is gated on an emailed 6-digit code. The app speaks plain SMTP
(`nodemailer`), so any provider works by setting the `SMTP_*` vars (§2) — no code
changes.

### Resend (the configured provider)

Free tier: 3,000 emails/month, 100/day, no credit card.
**Resend requires a verified domain before it will send anything** — there is no
shared-sender fallback.

1. **Add the domain** — [resend.com](https://resend.com) → **Domains → Add
   Domain**. Resend then lists the exact DNS records to create.
2. **Add those records at your DNS host** (GoDaddy: My Products → domain → DNS →
   Add): an SPF `TXT` (includes `_spf.resend.com`), a DKIM record
   (`resend._domainkey…`), and optionally a DMARC `TXT`.
   > ⚠️ **GoDaddy appends the domain to the Name field automatically.** If Resend
   > shows `resend._domainkey.yourdomain.com`, enter only `resend._domainkey`.
   > Entering the full value creates a broken doubled record — the most common
   > verification failure. Propagation is usually minutes (up to 48h worst case).
3. **Create an API key** — Resend → **API Keys** → Create. Copy it immediately
   (`re_…`); it is shown only once.
4. **Set the env vars:**
   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend                              # literally the word "resend"
   SMTP_PASS=re_xxxxxxxxxxxx                     # the API key
   SMTP_FROM=ELECTROCUP <no-reply@yourdomain.com>
   ```
   `SMTP_USER` is the literal string `resend`, **not** an email address.
   `SMTP_FROM` must be on the **verified domain**. A `no-reply@` address needs no
   mailbox — nothing has to receive mail there.

> **Note:** a mailbox product (e.g. GoDaddy/Google Workspace email) is a separate
> thing from Resend — that's for humans reading mail. Resend only needs DNS
> control of the domain, so a mailbox plan isn't required to send OTPs.

### Alternatives

- **Brevo** — `smtp-relay.brevo.com:587`, user = SMTP login, pass = **SMTP key**
  (not the v3 API key). Can verify a single sender address instead of a whole
  domain, so it works before you own a domain.
- **Gmail** — `smtp.gmail.com:587` with a 16-char **App Password** (requires 2FA).
  Testing only: it's built for personal mail and throttles/flags automated bursts.

### Verify before launch

```bash
npm run email:test -- you@example.com    # checks credentials, then sends a real email
```

Then set the same vars in Vercel (Production) and redeploy.

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

- **Players — register (once):** `POST /api/auth/otp/request` emails a code
  (one-time email verification); `POST /api/auth/otp/verify` checks it and
  issues a session; `POST /api/register` takes the entry details **plus a
  password** (scrypt-hashed, `src/lib/password.ts`).
- **Players — sign in (every time after):** `POST /api/auth/login` with
  email + password. **No OTP email is spent on sign-ins.** With
  `intent: 'register'`, the OTP request endpoint short-circuits for an address
  that already holds an entry instead of sending a code.
- **Forgot password:** `POST /api/auth/otp/request` (sends a code) →
  `POST /api/auth/password/reset` `{ email, code, newPassword }` — also the
  path for any account that pre-dates passwords.
- Web uses httpOnly cookies; login/verify/reset responses **also return a
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

## 9b. Abuse protection & housekeeping

**Rate limits.** `/api/auth/otp/request` is unauthenticated and spends money on
every call, so it is capped in `src/app/api/auth/otp/request/route.ts`:

| Scope | Limit | Why |
|-------|-------|-----|
| per email address | 3 per 15 min | the real abuse guard — stops hammering one inbox |
| per IP | 100 per 15 min | backstop against cycling addresses |

The per-IP cap is intentionally loose: Ethiopian mobile networks put many
subscribers behind one carrier-NAT address, and a tight cap would block genuine
registrations during a launch spike. A request rejected by the per-address limit
does **not** consume IP budget, so one person retrying cannot lock out everyone
sharing their NAT. Counters live in the `rate_limits` table (atomic upsert, so
concurrent requests cannot race past the cap) and the limiter **fails open** — if
it errors, the request is allowed rather than taking registration down.

Blocked requests return **429** with a `Retry-After` header. If the mail provider
is down or over quota the endpoint returns **503** with a retryable message (not a
500), and the undeliverable code is removed rather than left to confuse the user's
next attempt.

**Housekeeping.** Expired OTP rows and stale counters accumulate; sweep them on a
schedule (daily is plenty):

```bash
npm run db:cleanup
```

Run it from Vercel Cron, a Render cron job, or any scheduler. It is safe to run
repeatedly and while the app is serving.

> ⚠️ **The `db:*` scripts read `.env`, while `npm run dev` reads `.env.local`.**
> If `.env` holds your **production** `DATABASE_URL`, then `db:migrate`,
> `db:cleanup` and especially `db:reset` act on **production** from your laptop.
> Check which database you are pointed at before running them.

---

## 9c. Security model

What's enforced in code (all verified by live tests):

**Sessions** (`src/lib/session.ts`)
- Signed httpOnly cookies (HMAC-SHA256), tamper-proof; the mobile app carries the
  same token in a `Cookie` header.
- Expiry is enforced **server-side** from the signed `iat`: players 30 days,
  admin **12 hours**. A stolen token goes stale on schedule regardless of the
  client. Admin cookie is `SameSite=strict`.
- `SESSION_SECRET` is **mandatory in production** — the server refuses to fall
  back to the dev secret. Rotating it invalidates all sessions (players just
  sign in again; nothing is lost — data lives in Postgres).

**OTP** (`src/lib/otp.ts`)
- Codes stored only as HMAC hashes, 5-minute TTL, **exactly 5 guesses**
  (atomic counter — parallel requests can't exceed it), **single-use**
  (concurrent duplicate verify loses). Delivery failure returns 503 and removes
  the undeliverable code.

**Rate limits** (Postgres-backed, atomic, fail-open — see §9b)
- OTP request: 3/15 min per email, 100/15 min per IP
- OTP verify: 100/15 min per IP (backstop)
- Admin login: **5/15 min per IP** (brute-force lockout, 429 + `Retry-After`)
- Sponsor form: 5/hour per IP

**HTTP layer**
- `src/middleware.ts` rejects cross-origin browser writes to `/api/*` (403).
  Requests without an `Origin` header pass — that's the mobile app and curl,
  which carry no ambient browser credentials.
- Security headers on every response (`next.config.mjs`): CSP (self + Google
  Fonts; blocks external script injection), HSTS, `X-Frame-Options: DENY`,
  nosniff, referrer and permissions policies.
- Image optimizer endpoint (`/_next/image`) disabled — unused surface with
  known DoS advisories. Re-enable with strict `remotePatterns` if real art
  lands via `next/image`.

**Data layer**
- All SQL is parameterized (no string interpolation anywhere).
- DB TLS is **verified** with `PGSSL=true` (see `.env.example` for modes).
- Admin CSV export neutralizes spreadsheet formula injection (`=`, `+`, `-`,
  `@` prefixes) in player-controlled fields.

**Known accepted risk**
- `npm audit` still flags `next@14.2.35` (+ its bundled postcss): several 14.x
  advisories are only fully fixed in **Next 16**, a breaking migration. The
  affected features (image optimizer, rewrites, Server Actions, i18n Pages
  Router, self-hosted caches, WebSockets) are unused or disabled here, and
  Vercel's managed CDN covers the cache-poisoning class. **Roadmap:** migrate
  to Next 15/16 after launch; until then, keep 14.2.x at its latest patch.

---

## 10. Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Users request a code but never get it in prod | `SMTP_HOST` unset → wire SMTP (§6). |
| `503` "couldn't send the code" | Mail provider rejected the send — bad API key, unverified domain, or quota exhausted. Check the provider dashboard; server logs carry the exact SMTP error. |
| `429` "too many code requests" | Rate limit hit (§9b). Expected for repeat attempts; if legitimate users report it at scale, raise `PER_IP` in the OTP request route. |
| `password authentication failed` at build/seed | Wrong `DATABASE_URL`, or missing `?sslmode=require` / `PGSSL=true`. |
| `too many connections` under load | Use Neon's **pooled** string (host has `-pooler`). |
| Build fails on type errors | Confirm the two `ignore*` flags in `next.config.mjs` are present. |
| Admin login fails | `ADMIN_EMAIL`/`ADMIN_PASSWORD` not set in Vercel env. |

---

## Still owned by the developer (search `TODO(dev)`)

Registration fields, payment gateway, multi-admin, and bracket/standings
ingestion remain open — see the main `README.md` and inline `TODO(dev)` markers.
