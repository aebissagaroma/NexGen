'use client';
// Appeal against a disqualification.
//
// Registering twice disqualifies you, and that rule will occasionally catch
// someone honest — a family sharing one email, a mistyped ID digit, siblings on
// one address. This is the route back, so it deliberately needs no login: a
// person blocked before finishing sign-in must still be able to reach it.
import * as React from 'react';

export function AppealForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fd.get('fullName'), email: fd.get('email'), reason: fd.get('reason'),
        }),
      });
      if (res.ok) { setSent(true); return; }
      setErr((await res.json().catch(() => ({}))).error || 'Something went wrong. Try again.');
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div role="status" style={{ marginTop: 24, padding: '20px 22px', border: '1px solid rgba(var(--accent-glow-rgb),0.35)', background: 'rgba(var(--accent-rgb),0.06)' }}>
        <div className="display-2" style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-glow)' }}>APPEAL RECEIVED.</div>
        <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          NexGen staff will review it and reply to the email you gave. Please don&apos;t submit another entry
          in the meantime — that is what triggers disqualification in the first place.
        </p>
      </div>
    );
  }

  return (
    <details style={{ marginTop: 24, border: '1px solid var(--line-2)', background: 'var(--bg-1)' }}>
      <summary className="mono" style={{ cursor: 'pointer', padding: '14px 18px', fontSize: 11, letterSpacing: '.18em', color: 'var(--accent-glow)' }}>
        APPEAL THIS DECISION →
      </summary>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, padding: '4px 18px 20px' }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          Blocked by mistake? It happens — families sharing one email address, a mistyped ID number,
          siblings on one account. Tell us what happened and we will look into it.
        </p>
        <div><label className="label">Full name</label><input className="field" name="fullName" required placeholder="As on your ID" /></div>
        <div><label className="label">Email</label><input className="field" type="email" name="email" required defaultValue={defaultEmail} placeholder="you@example.com" /></div>
        <div>
          <label className="label">What happened?</label>
          <textarea className="field" name="reason" required minLength={10} maxLength={2000} rows={4} style={{ height: 'auto', paddingTop: 10, resize: 'vertical' }} placeholder="Explain why you think this is a mistake." />
        </div>
        {err && <div className="notice notice-err">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? 'SENDING…' : 'SUBMIT APPEAL →'}</button>
      </form>
    </details>
  );
}
