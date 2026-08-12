'use client';
// Staff sign-in. Accounts are created with `npm run admin:create` in the main
// repo — there is deliberately no self-service registration or reset here.
import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const fd = new FormData(e.target as HTMLFormElement);
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    });
    setBusy(false);
    if (res.ok) { router.replace('/'); router.refresh(); return; }
    setErr((await res.json().catch(() => ({}))).error || 'Sign-in failed.');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <form onSubmit={submit} style={{ width: 360, display: 'grid', gap: 16, border: '1px solid var(--line-2)', background: 'var(--bg-1)', padding: 28 }}>
        <div>
          <div className="marker">NEXGEN PLC · STAFF ONLY</div>
          <h1 style={{ fontSize: 20, margin: '10px 0 0' }}>ELECTROCUP <span style={{ color: 'var(--accent-glow)' }}>ADMIN</span></h1>
        </div>
        <label style={{ display: 'grid', gap: 6 }}>
          <span className="marker" style={{ color: 'var(--ink-4)' }}>EMAIL</span>
          <input className="field" name="email" type="email" required autoComplete="username" />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span className="marker" style={{ color: 'var(--ink-4)' }}>PASSWORD</span>
          <input className="field" name="password" type="password" required autoComplete="current-password" />
        </label>
        {err && <div className="notice notice-err">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? 'SIGNING IN…' : 'SIGN IN →'}</button>
        <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '.06em', margin: 0 }}>
          No account? Ask an owner to run the create-admin script.
        </p>
      </form>
    </div>
  );
}
