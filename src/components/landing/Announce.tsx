'use client';
// Announcements: a banner for phases whose date has just been published, and a
// box where anyone can ask to be told when the remaining TBA phases get dates.
//
// Most of the schedule is deliberately TBA (see TIMELINE in src/data/static.ts),
// so these two together are how someone finds out a date was set without having
// to keep checking the page.
import * as React from 'react';
import { announcedPhases } from '@/data/static';

/**
 * Renders nothing unless a phase carries `justAnnounced`, so it can sit in the
 * layout permanently and simply appear when ops publishes a date.
 */
export function AnnouncementBanner() {
  const items = announcedPhases();
  if (items.length === 0) return null;
  return (
    <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
      {items.map((t) => (
        <div
          key={t.phase}
          role="status"
          className="ticks"
          style={{
            position: 'relative', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            padding: '12px 18px', border: '1px solid rgba(var(--accent-glow-rgb),0.35)',
            background: 'linear-gradient(90deg, rgba(var(--accent-rgb),0.14), transparent 70%)',
          }}
        >
          <span className="tk1" /><span className="tk2" />
          <span className="tag tag-live" style={{ flexShrink: 0 }}>JUST ANNOUNCED</span>
          <span className="display-2" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.01em' }}>
            {t.phase.toUpperCase()}
          </span>
          <span className="mono" style={{ fontSize: 12, letterSpacing: '.14em', color: 'var(--accent-glow)' }}>
            {t.date}
          </span>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', color: 'var(--ink-3)' }}>
            {t.note}
          </span>
        </div>
      ))}
    </div>
  );
}

type State = 'idle' | 'busy' | 'done' | 'error';

/** Email capture for announcements. Open to anyone — no tournament entry needed. */
export function NotifyBox() {
  const [state, setState] = React.useState<State>('idle');
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('busy'); setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email') }),
      });
      if (res.ok) { setState('done'); return; }
      const data = await res.json().catch(() => ({}));
      setErr(data.error || 'Something went wrong. Try again.');
      setState('error');
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div
        data-reveal
        role="status"
        className="ticks"
        style={{
          position: 'relative', marginTop: 24, padding: '22px 24px', textAlign: 'center',
          border: '1px solid rgba(var(--accent-glow-rgb),0.35)',
          background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.10), transparent 60%)',
        }}
      >
        <span className="tk1" /><span className="tk2" />
        <div className="display-2" style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-glow)' }}>YOU&apos;RE ON THE LIST.</div>
        <p style={{ margin: '8px auto 0', maxWidth: '46ch', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          We&apos;ll email you as soon as each date is set. Nothing else — no spam.
        </p>
      </div>
    );
  }

  return (
    <div
      data-reveal
      className="ticks"
      style={{
        position: 'relative', marginTop: 24, padding: 'clamp(20px, 3vw, 30px)',
        border: '1px solid var(--line-2)',
        background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.07), transparent 55%),var(--bg-1)',
      }}
    >
      <span className="tk1" /><span className="tk2" />
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)', marginBottom: 8 }}>
            DATES ANNOUNCED STEP BY STEP
          </div>
          <div className="display-2" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>
            GET TOLD FIRST.
          </div>
          <p style={{ margin: '10px 0 0', maxWidth: '46ch', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            Leave your email and we&apos;ll tell you the moment a date is set. You don&apos;t need to register
            for the tournament — this is just for announcements.
          </p>
        </div>
        <form onSubmit={onSubmit} style={{ flex: '1 1 300px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label htmlFor="notify-email" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
            Email address for announcements
          </label>
          <input
            id="notify-email"
            className="field"
            style={{ flex: '1 1 180px', minWidth: 0 }}
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            aria-describedby={err ? 'notify-err' : undefined}
          />
          <button className="btn" disabled={state === 'busy'} style={{ flexShrink: 0 }}>
            {state === 'busy' ? 'SAVING…' : 'NOTIFY ME →'}
          </button>
          {err && (
            <div id="notify-err" className="notice notice-err" style={{ flexBasis: '100%' }}>{err}</div>
          )}
        </form>
      </div>
    </div>
  );
}
