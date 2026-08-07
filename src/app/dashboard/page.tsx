'use client';
// Admin dashboard — login gate, then a searchable/filterable registrations table
// with inline status controls and CSV export. Auth via /api/admin/login (env creds).
import * as React from 'react';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { PageFooter } from '@/components/SiteNotices';
import { CLUBS, SPONSORS_TIERS, INTERNAL_COMPANIES } from '@/data/static';

interface Reg { id: string; full_name: string; email: string; gamertag: string | null; club_code: string; club_name: string; phone: string | null; city: string | null; payment_status: string; status: string; created_at: string; }
interface Sponsor { id: string; company: string; contact_name: string; email: string; phone: string | null; tier: string | null; message: string | null; handled: boolean; created_at: string; }

type Tab = 'entries' | 'partners';

/** A related party rather than an outside brand — see INTERNAL_COMPANIES. */
function isInternal(s: Sponsor): boolean {
  return INTERNAL_COMPANIES.includes(s.company.trim().toLowerCase());
}

export default function DashboardPage() {
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [tab, setTab] = React.useState<Tab>('entries');
  const [rows, setRows] = React.useState<Reg[]>([]);
  const [sponsors, setSponsors] = React.useState<Sponsor[]>([]);
  const [q, setQ] = React.useState('');
  const [club, setClub] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const url = `/api/admin/registrations?q=${encodeURIComponent(q)}&club=${club}`;
    const res = await fetch(url);
    if (res.status === 401) { setAuthed(false); return; }
    setAuthed(true);
    setRows((await res.json()).registrations || []);
  }, [q, club]);

  // Loaded regardless of the active tab so the unanswered count can show on the
  // tab itself — the point is that staff see waiting partners without going
  // looking for them.
  const loadSponsors = React.useCallback(async () => {
    const res = await fetch('/api/admin/sponsors');
    if (!res.ok) return;
    setSponsors((await res.json()).sponsors || []);
  }, []);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { if (authed) loadSponsors(); }, [authed, loadSponsors]);

  const unanswered = sponsors.filter((s) => !s.handled).length;

  async function login(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    const fd = new FormData(e.target as HTMLFormElement);
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }) });
    if (res.ok) { setAuthed(true); load(); } else setErr((await res.json()).error || 'Login failed.');
  }
  async function logout() { await fetch('/api/admin/login', { method: 'DELETE' }); setAuthed(false); }

  async function update(id: string, patch: Record<string, string>) {
    await fetch('/api/admin/registrations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }) });
    load();
  }

  /**
   * Ops override on a gamertag.
   *
   * Unlike the selects above this can fail in ways staff must see — the handle
   * is taken, or the shape is wrong — so it reports instead of silently
   * reloading. The server updates brackets and standings in the same
   * transaction, so a rename after the draw stays consistent.
   */
  async function renameTag(id: string, current: string | null) {
    const next = window.prompt(
      'New gamertag for this entry.\n\n'
      + 'This is an override: it ignores the blocklist, the qualifier lock, and\n'
      + 'whether the tag is already on a bracket. Brackets and standings are\n'
      + 'updated to match.',
      current ?? '',
    );
    if (next === null) return;
    const res = await fetch('/api/admin/registrations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, gamertag: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { window.alert(data.error || 'Could not rename that entry.'); return; }
    load();
  }

  async function setHandled(id: string, handled: boolean) {
    await fetch('/api/admin/sponsors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, handled }) });
    loadSponsors();
  }

  if (authed === null) return (<><PageHeader /><div className="page-wrap"><div className="mono" style={{ color: 'var(--ink-3)', letterSpacing: '.18em', fontSize: 12 }}>LOADING…</div></div></>);

  if (!authed) return (
    <>
      <PageHeader />
      <div className="page-wrap" style={{ maxWidth: 440 }}>
        <PageTitle file="STAFF · SECURE" title="ADMIN" sub="NexGen staff only." />
        <form onSubmit={login} className="form-card" style={{ display: 'grid', gap: 18 }}>
          <div><label className="label">Email</label><input className="field" name="email" type="email" required /></div>
          <div><label className="label">Password</label><input className="field" name="password" type="password" required /></div>
          {err && <div className="notice notice-err">{err}</div>}
          <button className="btn">SIGN IN →</button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <PageHeader right={<button onClick={logout} className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-2)', background: 'none', border: 0 }}>LOG OUT</button>} />
      <div className="page-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
          <PageTitle file={tab === 'entries' ? 'STAFF · REGISTRATIONS' : 'STAFF · PARTNERS'} title="DASHBOARD" />
          {tab === 'entries' && <a href="/api/admin/registrations/export" className="btn" style={{ padding: '12px 20px', fontSize: 12 }}>EXPORT CSV ↓</a>}
        </div>

        <Tabs tab={tab} setTab={setTab} entries={rows.length} waiting={unanswered} />

        {tab === 'partners' ? (
          <>
            {sponsors.length > 0 && <TierDemand rows={sponsors} />}
            <PartnersTable rows={sponsors} onHandled={setHandled} />
          </>
        ) : (
        <>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <input className="field" style={{ maxWidth: 280 }} placeholder="Search name, gamertag, email, ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field" style={{ maxWidth: 200 }} value={club} onChange={(e) => setClub(e.target.value)}>
            <option value="">All clubs</option>
            {CLUBS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <div className="mono" style={{ alignSelf: 'center', color: 'var(--ink-3)', fontSize: 11, letterSpacing: '.12em' }}>{rows.length} ENTRIES</div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--line-2)', borderRadius: 4 }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Gamertag</th><th>Club</th><th>Email</th><th>Phone</th><th>Payment</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--ink)' }}>{r.full_name}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.gamertag || '—'}
                    <button
                      type="button"
                      onClick={() => renameTag(r.id, r.gamertag)}
                      title="Rename this gamertag (ops override)"
                      className="mono"
                      style={{
                        marginLeft: 8, padding: '2px 7px', fontSize: 9.5, letterSpacing: '.1em',
                        cursor: 'pointer', border: '1px solid var(--line-2)',
                        background: 'var(--bg-1)', color: 'var(--ink-3)',
                      }}
                    >
                      EDIT
                    </button>
                  </td>
                  <td className="mono" style={{ color: 'var(--ink-3)' }}>{r.club_code}</td>
                  <td className="mono">{r.email}</td>
                  <td className="mono">{r.phone || '—'}</td>
                  <td>
                    <select className="field" style={{ height: 32, fontSize: 12, maxWidth: 120 }} value={r.payment_status} onChange={(e) => update(r.id, { paymentStatus: e.target.value })}>
                      <option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="waived">Waived</option>
                    </select>
                  </td>
                  <td>
                    <select className="field" style={{ height: 32, fontSize: 12, maxWidth: 130 }} value={r.status} onChange={(e) => update(r.id, { status: e.target.value })}>
                      <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="mono" style={{ color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-4)', padding: 40 }} className="mono">NO REGISTRATIONS YET</td></tr>}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>
      <PageFooter />
    </>
  );
}

function Tabs({ tab, setTab, entries, waiting }: { tab: Tab; setTab: (t: Tab) => void; entries: number; waiting: number }) {
  const items: { key: Tab; label: string; count: number; alert?: boolean }[] = [
    { key: 'entries', label: 'ENTRIES', count: entries },
    { key: 'partners', label: 'PARTNER INQUIRIES', count: waiting, alert: waiting > 0 },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
      {items.map((it) => {
        const on = tab === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            className="mono"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '10px 16px', fontSize: 11, letterSpacing: '.14em',
              border: '1px solid ' + (on ? 'var(--accent-glow)' : 'var(--line-2)'),
              background: on ? 'rgba(var(--accent-rgb),0.08)' : 'var(--bg-1)',
              color: on ? 'var(--ink)' : 'var(--ink-3)',
            }}
          >
            {it.label}
            {it.count > 0 && (
              <span style={{
                padding: '2px 7px', fontSize: 10, borderRadius: 10,
                background: it.alert ? 'var(--accent-glow)' : 'var(--line-2)',
                color: it.alert ? '#000' : 'var(--ink-2)',
              }}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Demand per tier, against the seats that tier actually has. This is the number
// that informs whether to sign now or wait: three parties chasing one Title seat
// is a different negotiation from one party chasing four Gold seats. Seat counts
// are staff-only — the public page deliberately does not publish them.
function TierDemand({ rows }: { rows: Sponsor[] }) {
  // Related parties are excluded here — see INTERNAL_COMPANIES. They stay in the
  // list below, just not in the number used to judge outside demand.
  const external = rows.filter((r) => !isInternal(r));
  const internalCount = rows.length - external.length;

  const counts = SPONSORS_TIERS.map((t) => {
    const all = external.filter((r) => (r.tier || '').toLowerCase() === t.key.toLowerCase());
    return { ...t, total: all.length, open: all.filter((r) => !r.handled).length };
  });
  const untargeted = external.filter((r) => !r.tier).length;
  const peak = Math.max(1, ...counts.map((c) => c.total));

  return (
    <div style={{ border: '1px solid var(--line-2)', borderRadius: 4, padding: 20, marginBottom: 20 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--ink-3)', marginBottom: 16 }}>
        DEMAND BY TIER
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {counts.map((c) => (
          <div key={c.key} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 14, alignItems: 'center' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.12em', color: 'var(--ink-2)' }}>{c.key.toUpperCase()}</div>
            <div style={{ height: 8, background: 'var(--bg-1)', border: '1px solid var(--line-2)', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0, width: `${(c.total / peak) * 100}%`,
                background: c.total > c.seats ? 'var(--accent-glow)' : 'var(--line-2)',
              }} />
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
              <strong style={{ color: c.total > c.seats ? 'var(--accent-glow)' : 'var(--ink-2)' }}>{c.total}</strong>
              {' '}for {c.seats} seat{c.seats > 1 ? 's' : ''}
              {c.open > 0 && <span style={{ color: 'var(--ink-4)' }}> · {c.open} open</span>}
            </div>
          </div>
        ))}
      </div>
      {untargeted > 0 && (
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 14 }}>
          + {untargeted} with no tier stated
        </div>
      )}
      <p style={{ color: 'var(--ink-4)', fontSize: 11.5, lineHeight: 1.55, margin: '14px 0 0' }}>
        Outside interest only. Highlighted where it already exceeds the seats available.
        Seat counts are not shown on the public site.
        {internalCount > 0 && ` ${internalCount} internal ${internalCount === 1 ? 'entry is' : 'entries are'} excluded from these counts.`}
      </p>
    </div>
  );
}

// Partner inquiries. Unanswered ones are highlighted and sort first — a lead
// sitting here unread is the exact failure this whole view exists to prevent.
function PartnersTable({ rows, onHandled }: { rows: Sponsor[]; onHandled: (id: string, handled: boolean) => void }) {
  if (rows.length === 0) {
    return (
      <div style={{ border: '1px solid var(--line-2)', borderRadius: 4, padding: 40, textAlign: 'center' }} className="mono">
        <span style={{ color: 'var(--ink-4)' }}>NO PARTNER INQUIRIES YET</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {rows.map((s) => (
        <div key={s.id} style={{
          border: '1px solid ' + (s.handled ? 'var(--line-2)' : 'var(--accent-glow)'),
          background: s.handled ? 'var(--bg-1)' : 'rgba(var(--accent-rgb),0.05)',
          borderRadius: 4, padding: 18, opacity: s.handled ? 0.62 : 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '.18em', color: 'var(--accent-glow)' }}>
                {(s.tier || 'NO TIER').toUpperCase()}
              </span>
              {isInternal(s) && (
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.16em', color: 'var(--ink-3)', border: '1px solid var(--line-2)', padding: '2px 6px', marginLeft: 10 }}>
                  INTERNAL
                </span>
              )}
              <div style={{ color: 'var(--ink)', fontSize: 17, marginTop: 4 }}>{s.company}</div>
            </div>
            <button
              onClick={() => onHandled(s.id, !s.handled)}
              className="mono"
              style={{
                cursor: 'pointer', padding: '8px 14px', fontSize: 10.5, letterSpacing: '.14em',
                border: '1px solid var(--line-2)', background: 'var(--bg-1)',
                color: s.handled ? 'var(--ink-3)' : 'var(--ink)',
              }}
            >{s.handled ? 'REOPEN' : 'MARK HANDLED'}</button>
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 12, display: 'grid', gap: 4 }}>
            <div>{s.contact_name} · <a href={`mailto:${s.email}`} style={{ color: 'var(--accent-glow)' }}>{s.email}</a>{s.phone ? ` · ${s.phone}` : ''}</div>
            <div style={{ color: 'var(--ink-4)', fontSize: 11 }}>{new Date(s.created_at).toLocaleString()}</div>
          </div>
          {s.message && (
            <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6, marginTop: 12, whiteSpace: 'pre-wrap' }}>{s.message}</p>
          )}
        </div>
      ))}
    </div>
  );
}
