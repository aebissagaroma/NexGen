# ELECTROCUP 26 — Staff Panel

Separate admin app (Kairos-style), same database as the main site. Per-person
staff accounts, live overview, registrations management, appeals queue, partner
inquiries, notify-list export, and the **bracket draw generator + result entry**
that fills the `matches` table the public `/bracket` page renders.

## Run locally

```bash
cd admin
npm install
cp .env.example .env.local   # point DATABASE_URL at your DB, set ADMIN_SESSION_SECRET
npm run dev                  # http://localhost:3001
```

Create a staff account (from the **repo root**, against the same DATABASE_URL):

```bash
npm run admin:create -- ops@nexgenplc.com "Full Name" staff   # or: owner
```

The command prints a temporary password once. Re-running it for the same email
resets the password. There is deliberately no self-service signup or reset.

## Deploy (second Vercel project)

1. Vercel → **Add New Project** → import the **same GitHub repo**.
2. **Root Directory: `admin`** (this is the whole trick — one repo, two projects).
3. Environment variables (Production):
   - `DATABASE_URL` — the same Neon **pooled** URL as the main site
   - `PGSSL=true`
   - `ADMIN_SESSION_SECRET` — fresh 32-byte random, NOT the main site's secret
4. Deploy, then add the domain (e.g. `admin.nexgentournaments.com`).
5. Run `npm run admin:create` (repo root, `.env` pointing at Neon) for each
   staff member.

Schema changes it depends on (the `admins` table) live in the main repo's
`db/schema.sql` and are applied by the main project's deploy migration — this
app never migrates anything itself.

## Operational notes

- **Draw**: generated per club from **confirmed** entries only (pending or
  rejected entries are not in the draw). Byes resolve automatically. A bracket
  can be cleared only until the first result is recorded.
- **Closing Group A** is *not* a button here by design: it's the
  `GROUP_A_CLOSED` flag in the main site's `src/data/static.ts`, deployed
  together with the draw announcement — an auditable, versioned event.
- Results propagate winners forward automatically; a result can be corrected
  until the match it feeds has its own result.
- Sessions last 12 hours (`SameSite=strict`); sign-in is rate-limited
  (5 tries / 15 min / IP). The whole app sends `X-Robots-Tag: noindex`.
