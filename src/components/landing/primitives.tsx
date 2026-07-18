'use client';
// Shared primitives ported from primitives.jsx (Countdown, marks, ClubCode, etc.)
import * as React from 'react';

export function NexGenMark({ size = 28 }: { size?: number }) {
  const eGlyph = 'M26 16 H80 L70 32 H42 V44 H70 L60 60 H42 V70 H74 L64 86 H26 Z';
  return (
    <span aria-label="ELECTROCUP · NexGen PLC" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span style={{
        width: size, height: size, position: 'relative', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', borderRadius: size * 0.24, overflow: 'hidden',
        background: 'radial-gradient(120% 120% at 32% 20%, #1B1B1F, #060607)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -${Math.round(size * 0.14)}px ${Math.round(size * 0.3)}px rgba(0,0,0,0.28), 0 4px 14px rgba(0,0,0,0.4)`,
      }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 100 100" style={{ position: 'relative', zIndex: 2 }}>
          <defs>
            <linearGradient id="voltE-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F2DD9C" /><stop offset="42%" stopColor="#C79A3A" />
              <stop offset="72%" stopColor="#7E5A12" /><stop offset="100%" stopColor="#E7CE86" />
            </linearGradient>
          </defs>
          <path d={eGlyph} fill="url(#voltE-grad)" style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.28)) drop-shadow(0 -1px 1.6px rgba(0,0,0,0.55))' }} />
        </svg>
      </span>
    </span>
  );
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function Countdown({ target, compact = false }: { target: number; compact?: boolean }) {
  const now = useNow(1000);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  // Avoid hydration mismatch: render zeros on the server, real time after mount.
  const show = mounted ? { d, h, m, s } : { d: 0, h: 0, m: 0, s: 0 };
  const cells = [
    { v: pad(show.d), l: 'DAYS' }, { v: pad(show.h), l: 'HOURS' },
    { v: pad(show.m), l: 'MIN' }, { v: pad(show.s), l: 'SEC' },
  ];
  if (compact) {
    return (
      <span className="mono num" style={{ color: 'var(--ink)', letterSpacing: '.06em' }}>
        {pad(show.d)}D : {pad(show.h)}H : {pad(show.m)}M : {pad(show.s)}S
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
      {cells.map((c, i) => (
        <div key={c.l} style={{ flex: '0 0 auto', minWidth: 92, padding: '14px 16px 12px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line-2)', borderRadius: 2, textAlign: 'left', position: 'relative' }}>
          <div className="display num" style={{ fontSize: 56, lineHeight: 0.95, color: 'var(--ink)' }}>{c.v}</div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)', marginTop: 6 }}>{c.l}</div>
          <span style={{ position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: '50%', background: i === 3 ? 'var(--accent-glow)' : 'transparent', boxShadow: i === 3 ? '0 0 0 4px rgba(var(--accent-glow-rgb),0.18)' : 'none', animation: i === 3 ? 'pulse 1.4s ease-in-out infinite' : 'none' }} />
        </div>
      ))}
    </div>
  );
}

export function ClubCode({ code, accent }: { code: string; accent?: string }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: 2, border: '1px solid var(--line-2)', background: 'var(--bg-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '.05em', color: 'var(--ink)', position: 'relative', flex: '0 0 auto' }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent || 'var(--accent)' }} />
      {code}
    </div>
  );
}

// Scroll-reveal — reveals [data-reveal] elements as they enter the viewport.
export function useReveal() {
  React.useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '-10% 0px -5% 0px', threshold: 0.05 });
    document.querySelectorAll('[data-reveal]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// Design-time image placeholder. TODO(dev): swap for <Image> with real art.
export function Placeholder({ label, aspect = '16 / 7' }: { label: string; aspect?: string }) {
  return (
    <div className="stripe" style={{ width: '100%', aspectRatio: aspect, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--line-2)', background: 'transparent' }}>
      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.22em' }}>{label}</span>
    </div>
  );
}
