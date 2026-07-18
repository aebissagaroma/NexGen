'use client';
// Clubs grid, ported from clubs.jsx. Reads live registration counts from the API
// (falls back to the static list on first paint / if the API is unavailable).
import * as React from 'react';
import Link from 'next/link';
import { ClubCode } from './primitives';
import { CLUBS as STATIC_CLUBS } from '@/data/static';

interface ClubRow { code: string; name: string; city: string; regs?: number; }

export function ClubsSection() {
  const [clubs, setClubs] = React.useState<ClubRow[]>(STATIC_CLUBS);
  React.useEffect(() => {
    fetch('/api/clubs').then((r) => r.json()).then((d) => { if (d.clubs?.length) setClubs(d.clubs); }).catch(() => {});
  }, []);
  const totalRegs = clubs.reduce((s, c) => s + (c.regs ?? 0), 0);

  return (
    <section id="clubs" className="section" style={{ background: 'var(--bg-1)' }}>
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div className="section-head-row">
            <div>
              <div className="marker">FILE/03 · CLUB SLOTS</div>
              <h2 className="section-title" style={{ marginTop: 16 }}>TWENTY SLOTS.<br /><span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>ALL OPEN.</span></h2>
            </div>
            <div style={{ alignSelf: 'flex-end', textAlign: 'right' }}>
              <div className="display num" style={{ fontSize: 56, lineHeight: 1, color: 'var(--accent-glow)' }}>20/20</div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)', marginTop: 6 }}>CLUB SLOTS · {totalRegs} ENTRIES · REGISTRATION OPEN</div>
            </div>
          </div>
        </div>

        <div data-reveal style={{ marginBottom: 24, padding: '12px 18px', border: '1px solid var(--line-2)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>NOTICE</span>
            <span style={{ width: 1, height: 12, background: 'var(--line-strong)' }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '.10em', color: 'var(--ink-2)' }}>QUALIFIER REGISTRATION IS OPEN · PICK A CLUB TO ENTER ITS BRACKET</span>
          </div>
          <Link href="/register" className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink)', textTransform: 'uppercase', borderBottom: '1px solid var(--accent)', paddingBottom: 2 }}>REGISTER →</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }} className="clubs-grid">
          {clubs.map((c, i) => <ClubCell key={c.code} club={c} idx={i} />)}
        </div>
      </div>
      <style>{`@media (max-width:1100px){.clubs-grid{grid-template-columns:repeat(3,1fr)!important}}@media (max-width:760px){.clubs-grid{grid-template-columns:repeat(2,1fr)!important}}@media (max-width:460px){.clubs-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}

function ClubCell({ club, idx }: { club: ClubRow; idx: number }) {
  const [hovered, setHovered] = React.useState(false);
  const regs = club.regs ?? 0;
  return (
    <Link href={`/register?club=${club.code}`} data-reveal onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? 'var(--bg-2)' : 'var(--bg)', padding: 22, position: 'relative', transition: 'background .2s ease', transitionDelay: `${Math.min(idx, 12) * 30}ms`, display: 'block', color: 'inherit' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, height: 2, width: hovered ? '100%' : '20%', background: 'var(--accent)', transition: 'width .35s cubic-bezier(.2,.7,.2,1)', boxShadow: '0 0 12px var(--accent)', opacity: hovered ? 1 : 0.4 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <ClubCode code={club.code} />
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.22em', color: 'var(--accent-glow)', fontWeight: 600 }}>OPEN</span>
      </div>
      <div className="display-2" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.05, color: 'var(--ink)', minHeight: 44 }}>{club.name}</div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--ink-3)', marginTop: 4 }}>{club.city.toUpperCase()}</div>
      <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px dashed var(--line-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.18em', color: 'var(--ink-3)' }}>{regs > 0 ? `${regs} ENTRANT${regs > 1 ? 'S' : ''}` : 'AWAITING ENTRANTS'}</span>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.18em', color: hovered ? 'var(--accent-glow)' : 'var(--ink-3)', transition: 'color .15s ease' }}>ENTER →</span>
      </div>
    </Link>
  );
}
