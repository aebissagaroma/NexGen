'use client';
// Admin dashboard — login gate, then a searchable/filterable registrations table
// with inline status controls and CSV export. Auth via /api/admin/login (env creds).
import * as React from 'react';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { CLUBS } from '@/data/static';

interface Reg { id: string; full_name: string; email: string; gamertag: string; club_code: string; club_name: string; platform: string | null; city: string | null; payment_status: string; status: string; created_at: string; }

export default function DashboardPage() {
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [rows, setRows] = React.useState<Reg[]>([]);
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

  React.useEffect(() => { load(); }, [load]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
          <PageTitle file="STAFF · REGISTRATIONS" title="DASHBOARD" />
          <a href="/api/admin/registrations/export" className="btn" style={{ padding: '12px 20px', fontSize: 12 }}>EXPORT CSV ↓</a>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <input className="field" style={{ maxWidth: 280 }} placeholder="Search name, gamertag, email…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field" style={{ maxWidth: 200 }} value={club} onChange={(e) => setClub(e.target.value)}>
            <option value="">All clubs</option>
            {CLUBS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <div className="mono" style={{ alignSelf: 'center', color: 'var(--ink-3)', fontSize: 11, letterSpacing: '.12em' }}>{rows.length} ENTRIES</div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--line-2)', borderRadius: 4 }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Gamertag</th><th>Club</th><th>Email</th><th>Platform</th><th>Payment</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--ink)' }}>{r.full_name}</td>
                  <td>{r.gamertag}</td>
                  <td className="mono" style={{ color: 'var(--ink-3)' }}>{r.club_code}</td>
                  <td className="mono">{r.email}</td>
                  <td>{r.platform || '—'}</td>
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
      </div>
    </>
  );
}
