'use client';
// Confirm-your-entry: the one place an ID number is collected.
//
// Registration takes no ID at all. An entry has to be confirmed with a national
// ID number before its group's bracket draw is announced, and an unconfirmed
// entry is not included in the draw. That is the whole purpose of this page, so
// it says it in the first line rather than burying it under a form.
import * as React from 'react';
import Link from 'next/link';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { PageFooter } from '@/components/SiteNotices';
import { AppealForm } from '@/components/AppealForm';

type Entry = { id_status: 'unconfirmed' | 'confirmed' | 'void'; id_confirmed_at: string | null; club_code: string; gamertag: string | null };

export default function ConfirmEntryPage() {
  const [loading, setLoading] = React.useState(true);
  const [signedIn, setSignedIn] = React.useState(true);
  const [entry, setEntry] = React.useState<Entry | null>(null);
  const [value, setValue] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/confirm-entry');
      if (res.status === 401) { setSignedIn(false); return; }
      const data = await res.json();
      setEntry(data.entry ?? null);
    } catch {
      setErr('Could not reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/confirm-entry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber: value }),
      });
      const data = await res.json().catch(() => ({}));
      // Cleared immediately either way: there is no reason for the number to
      // stay in the field, or in this component's state, once it has been sent.
      setValue('');
      if (!res.ok) {
        setErr(data.error || 'Could not confirm your entry. Try again.');
        if (data.status) await load();
        return;
      }
      await load();
    } catch {
      setErr('Could not reach the server. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader />
      <div className="page-wrap" style={{ maxWidth: 720 }}>
        <PageTitle
          file="ENTRY · CONFIRMATION"
          title={<>CONFIRM<br /><span style={{ color: 'var(--accent-glow)' }}>YOUR ENTRY.</span></>}
          sub="Before your bracket is drawn."
        />

        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.7, marginTop: 22 }}>
          Your entry has to be confirmed with your national ID number before your group&apos;s bracket
          draw is announced. Entries that are not confirmed by then are not included in the draw.
        </p>
        <p className="mono" style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)', lineHeight: 1.7, marginTop: 12 }}>
          We store an irreversible code derived from your number, never the number itself. Photo ID is
          checked in person at the Qualifier Center and no copy is kept.{' '}
          <Link href="/privacy" target="_blank" style={{ color: 'var(--accent-glow)' }}>See our privacy notice.</Link>
        </p>

        <div className="form-card" style={{ marginTop: 28 }}>
          {loading && <div className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)' }}>LOADING…</div>}

          {!loading && !signedIn && (
            <>
              <div className="notice">Sign in to confirm your entry.</div>
              <div style={{ marginTop: 18 }}><Link href="/register" className="btn">SIGN IN →</Link></div>
            </>
          )}

          {!loading && signedIn && !entry && (
            <>
              <div className="notice">You do not have an entry yet, so there is nothing to confirm.</div>
              <div style={{ marginTop: 18 }}><Link href="/register" className="btn">REGISTER →</Link></div>
            </>
          )}

          {!loading && signedIn && entry?.id_status === 'confirmed' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div className="display" style={{ fontSize: 'clamp(28px,4.5vw,44px)', color: 'var(--accent-glow)', lineHeight: 1 }}>CONFIRMED.</div>
              <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6, maxWidth: '44ch', margin: '16px auto 0' }}>
                Your entry for {entry.club_code} is confirmed and will be included in the draw. There is
                nothing more to do — we do not need your ID number again.
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/bracket" className="btn">VIEW BRACKETS →</Link>
                <Link href="/" className="btn-ghost">BACK HOME</Link>
              </div>
            </div>
          )}

          {!loading && signedIn && entry?.id_status === 'void' && (
            <>
              <div className="notice notice-err">
                This ID has already confirmed a different entry. The earliest registration stands. If you
                believe this is an error, appeal below.
              </div>
              <div style={{ marginTop: 20 }}><AppealForm /></div>
            </>
          )}

          {!loading && signedIn && entry?.id_status === 'unconfirmed' && (
            <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label className="label">Your national ID number</label>
                <input
                  className="field"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Fayda, Kebele ID or passport"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </div>
              {err && <div className="notice notice-err">{err}</div>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn" disabled={busy || !value.trim()}>{busy ? 'CONFIRMING…' : 'CONFIRM ENTRY →'}</button>
                <Link href="/" className="btn-ghost">LATER</Link>
              </div>
              <p className="mono" style={{ fontSize: 10, letterSpacing: '.06em', color: 'var(--ink-4)', lineHeight: 1.6, margin: 0 }}>
                You only do this once. Entering a number that already confirmed another entry does not
                take that entry over — the earliest registration stands.
              </p>
            </form>
          )}
        </div>
      </div>
      <PageFooter />
    </>
  );
}
