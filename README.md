# ELECTROCUP 26 — NexGen PLC

Full-stack tournament platform: marketing site, phone-OTP player registration,
live bracket/standings/profile views, a sponsor-inquiry form, and a staff admin
dashboard. Built with **Next.js 14 (App Router) + TypeScript** and **Postgres**
accessed with **plain SQL via `pg`** (no ORM).

---

## Stack

| Layer      | Choice                                            |
|------------|---------------------------------------------------|
| Framework  | Next.js 14 (App Router), React 18, TypeScript     |
| Data       | Postgres, queried with `pg` + hand-written SQL    |
| Auth       | Phone OTP for players; env-cred login for admin   |
| Sessions   | Stateless signed cookies (HMAC-SHA256, no table)  |
| Hosting    | Frontend on **Vercel**, backend/DB on **Render**  |

> The app is a single Next.js codebase — the API routes live in `src/app/api/*`.
> On Vercel the whole thing runs as one deployment. If you prefer, host the app
> on Render (it needs a Node server for the API routes + SSR) and use Vercel only
> for a static marketing mirror. `render.yaml` is a one-click blueprint for
> Render (web service + Postgres).

---

## Run it locally

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
#   → set DATABASE_URL to your local Postgres
#   → set SESSION_SECRET (any long random string)
#   → set ADMIN_EMAIL / ADMIN_PASSWORD

# 3. Create a database (once)
createdb electrocup           # or: psql -c "CREATE DATABASE electrocup;"

# 4. Apply schema + seed the 20 clubs
npm run db:reset              # = db:migrate + db:seed

# 5. Start
npm run dev                   # http://localhost:3000
```

### Trying the registration flow locally
No SMS provider is configured in dev, so **the OTP code is not texted** — it is
printed to the server console **and** returned in the API response, and the
register page shows it on screen. Enter it to continue. (This is disabled in
production automatically — see `src/lib/otp.ts`.)

### Admin dashboard
Go to **`/dashboard`** and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from
your env. You can search/filter registrations, change payment + status inline,
and export CSV.

---

## Project structure

```
electrocup/
├─ db/
│  ├─ schema.sql          # tables (idempotent) — the source of truth
│  └─ seed.sql            # the 20 Premier League clubs
├─ scripts/
│  ├─ migrate.mjs         # runs schema.sql   (npm run db:migrate)
│  └─ seed.mjs            # runs seed.sql      (npm run db:seed)
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                 # landing page (renders <Landing/>)
│  │  ├─ layout.tsx / globals.css # fonts, design tokens, form/table styles
│  │  ├─ register/page.tsx        # phone → OTP → details → confirmation
│  │  ├─ bracket/page.tsx         # live bracket viewer (per club)
│  │  ├─ standings/page.tsx       # league table
│  │  ├─ players/[tag]/page.tsx   # player profile
│  │  ├─ dashboard/page.tsx       # admin: list / search / CSV / mark paid
│  │  └─ api/                     # all backend endpoints (see below)
│  ├─ components/
│  │  ├─ landing/                 # the marketing site, ported to TSX
│  │  └─ PageHeader.tsx           # shared interior-page header
│  ├─ lib/
│  │  ├─ db.ts                    # pg Pool + query helpers
│  │  ├─ session.ts               # signed-cookie sessions (user + admin)
│  │  ├─ otp.ts                   # OTP generate/verify + SMS stub (TODO)
│  │  └─ validation.ts            # tiny input validators
│  ├─ data/static.ts             # editorial copy for the landing page
│  └─ types/index.ts             # DTOs (see TODOs on registration fields)
├─ render.yaml   vercel.json   .env.example
```

---

## API reference

| Method | Route                                   | Auth   | Purpose                              |
|--------|-----------------------------------------|--------|--------------------------------------|
| POST   | `/api/auth/otp/request`                 | —      | Send (dev: return) a 6-digit code    |
| POST   | `/api/auth/otp/verify`                  | —      | Verify code, create session          |
| GET    | `/api/auth/me`                          | user   | Current player session               |
| POST   | `/api/auth/logout`                      | —      | Clear player session                 |
| POST   | `/api/register`                         | user   | Create a qualifier registration      |
| GET    | `/api/register`                         | user   | The player's own registrations       |
| GET    | `/api/clubs`                            | —      | Clubs + live registration counts     |
| GET    | `/api/brackets?club=MCI`                | —      | Matches for a club bracket           |
| GET    | `/api/standings`                        | —      | League table                         |
| GET    | `/api/players/:tag`                     | —      | Player profile                       |
| POST   | `/api/sponsors`                         | —      | Sponsor inquiry                      |
| POST   | `/api/admin/login`                      | —      | Admin sign-in (env creds)            |
| GET    | `/api/admin/registrations?q=&club=`     | admin  | List / search / filter               |
| PATCH  | `/api/admin/registrations`              | admin  | Update payment/status                |
| GET    | `/api/admin/registrations/export`       | admin  | CSV download                         |

---

## What YOU (the developer) still own — search the code for `TODO(dev)`

1. **Registration fields.** The `registrations` table + `RegistrationInput`
   (`src/types/index.ts`) + the register form + `/api/register` capture a
   working minimum (name, gamertag, club, platform, city). Confirm the full set
   with NexGen ops (date of birth / 16+ check, EA·PSN·Xbox ID, jersey name,
   rulebook acceptance, emergency contact) and extend all four together.
2. **SMS delivery.** `src/lib/otp.ts → sendSms()` is a stub. Wire a real
   provider — an Ethiopian gateway (Afromessage / GeezSMS) is cheapest for
   `+251` numbers; Twilio works internationally. Then set `SMS_PROVIDER` etc.
3. **Payment.** Free registration for now (per current scope). When entry fees
   go live, add a gateway (Chapa / Telebirr) and gate `status='confirmed'` on it.
4. **Multi-admin.** Admin auth is a single env credential. For a team, add an
   `admins` table with per-user password hashes and swap `/api/admin/login`.
5. **Bracket/standings ingestion.** The `matches` and `standings` tables are
   defined and read by the viewers, but nothing writes them yet — add the draw
   generator + result entry (likely an extension of the admin dashboard).

---

## Design notes

The marketing site was designed first as an HTML prototype and ported here to
React/TSX component-for-component. Design tokens live as CSS variables in
`globals.css`; the multi-palette theme system (Obsidian is the brand default)
and the design-time Tweaks panel were carried over from the prototype
(`components/landing/Landing.tsx` + `TweaksPanel.tsx`). The Tweaks panel is a
design tool driven by an editor host — in a normal deployment it stays hidden.

Prize/hardware imagery uses labelled placeholders (`Placeholder` in
`components/landing/primitives.tsx`) — swap them for `next/image` with real art.
