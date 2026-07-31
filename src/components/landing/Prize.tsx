'use client';
// Prize section, ported from prize.jsx.
import * as React from 'react';
import { Placeholder } from './primitives';

const SEALED = [
  { rank: '02', title: 'RUNNER-UP', reveal: 'REVEAL · Q1 2027' },
  { rank: '03', title: 'SEMI-FINALIST', reveal: 'REVEAL · Q1 2027' },
  { rank: 'GW', title: 'GOLDEN BOOT', reveal: 'REVEAL · JUN 2027' },
  { rank: '++', title: 'GAMEWEEK & SPECIAL', reveal: 'REVEAL · ROLLING' },
];

export function PrizeSection() {
  return (
    <section id="prize" className="section" style={{ background: 'var(--bg-1)', backgroundImage: 'radial-gradient(1000px 500px at 20% 100%, rgba(var(--accent-rgb),0.10), transparent 65%),radial-gradient(800px 400px at 90% 0%, rgba(var(--accent-glow-rgb),0.06), transparent 60%)', overflow: 'hidden' }}>
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div className="section-head-row">
            <div>
              <div className="marker">FILE/05 · GRAND PRIZE</div>
              <h2 className="section-title" style={{ marginTop: 16 }}>THE WINNER<br /><span style={{ background: 'linear-gradient(180deg, var(--ink) 0%, var(--chrome-2) 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>DRIVES HOME</span><br /><span style={{ fontStyle: 'italic', color: 'var(--accent-glow)' }}>A SEAGULL.</span></h2>
            </div>
            <p className="section-sub" style={{ alignSelf: 'flex-end' }}>The grand prize for ELECTROCUP 26 is a brand-new <strong style={{ color: 'var(--ink)' }}>2025 BYD&nbsp;Seagull&nbsp;405KM</strong> — a 100% electric hatchback delivered at the Cup Final. Insurance, registration and the keys go to one player.</p>
          </div>
        </div>

        <div data-reveal className="ticks" style={{ position: 'relative', border: '1px solid var(--line-2)', background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)) ,var(--bg)', overflow: 'hidden' }}>
          <span className="tk1" /><span className="tk2" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>LOT 01 · GRAND PRIZE</span>
              <span style={{ width: 1, height: 12, background: 'var(--line-strong)' }} />
              <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>DELIVERED · AUG 2027 · HOST VENUE</span>
            </div>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>EC26 / VEH / 001</span>
          </div>
          <div style={{ position: 'relative', background: 'radial-gradient(circle at 50% 65%, rgba(var(--accent-glow-rgb),0.18), transparent 65%),linear-gradient(180deg, var(--bg-1) 0%, var(--bg) 80%)', padding: 8 }}>
            <Placeholder label="[ 2025 BYD SEAGULL 405KM ]" aspect="16 / 7" />
            <div className="display num" aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: -10, textAlign: 'center', fontSize: 'clamp(120px, 20vw, 280px)', lineHeight: 1, color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.06)', fontWeight: 900, pointerEvents: 'none', fontStyle: 'italic', letterSpacing: '-0.02em' }}>SEAGULL</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: '1px solid var(--line)' }} className="prize-specs">
            {[{ k: 'MAKE', v: 'BYD' }, { k: 'MODEL', v: 'SEAGULL 405KM' }, { k: 'YEAR', v: '2025' }, { k: 'RANGE', v: '405 KM' }, { k: 'POWERTRAIN', v: '100% EV' }].map((s, i) => (
              <div key={s.k} style={{ padding: '22px 22px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.22em', color: 'var(--ink-3)' }}>{s.k}</div>
                <div className="display-2" style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderTop: '1px solid var(--line)', gap: 16, flexWrap: 'wrap', background: 'var(--bg-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>INCLUDED ·</span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '.10em', color: 'var(--ink-2)' }}>REGISTRATION · 1Y INSURANCE · CHARGER · DELIVERY</span>
            </div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>PARTNER · KAIROS ADDIS</div>
          </div>
        </div>

        <div data-reveal style={{ marginTop: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '14px 22px', border: '1px solid var(--line-2)', borderBottom: 'none', background: 'linear-gradient(90deg, rgba(var(--accent-glow-rgb),0.05), transparent 70%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>FILE/05B · REMAINING LOTS</span>
            <span style={{ width: 1, height: 12, background: 'var(--line-strong)' }} />
            <span className="mono" style={{ fontSize: 10, letterSpacing: '.18em', color: 'var(--ink-3)' }}>4 SEALED · UNLOCK ON BROADCAST</span>
          </div>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>PRIZE POOL UNFOLDS THROUGH 2027 →</span>
        </div>

        <div data-reveal style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line-2)' }} className="side-prizes">
          {SEALED.map((p, i) => (
            <div key={p.rank} style={{ position: 'relative', background: 'var(--bg)', padding: '26px 22px 24px', overflow: 'hidden', isolation: 'isolate' }}>
              <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 9px)', pointerEvents: 'none', opacity: 0.7 }} />
              <div aria-hidden style={{ position: 'absolute', top: 14, right: 14, fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '.22em', color: 'rgba(var(--accent-2-rgb), 0.8)', border: '1px solid rgba(var(--accent-2-rgb), 0.55)', padding: '3px 6px', transform: 'rotate(-4deg)' }}>SEALED</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>PLACE / {p.rank}</div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--accent-glow)', marginTop: 8 }}>{p.title}</div>
              <div aria-hidden style={{ position: 'relative', marginTop: 16, height: 28, background: '#000', border: '1px solid var(--line-2)', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 11px)' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '.4em', color: 'rgba(255,255,255,0.18)' }}>▮▮▮▮▮▮▮▮▮▮▮▮</div>
              </div>
              <div aria-hidden style={{ marginTop: 6, height: 10, background: '#000', width: i % 2 ? '62%' : '78%', border: '1px solid var(--line-2)' }} />
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.22em', color: 'var(--ink-3)' }}>{p.reveal}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: .55 }}>
                  <rect x="3" y="6" width="8" height="6" stroke="currentColor" strokeWidth="1" />
                  <path d="M5 6V4.5a2 2 0 0 1 4 0V6" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div data-reveal className="mono" style={{ marginTop: 18, fontSize: 10.5, letterSpacing: '.22em', color: 'var(--ink-3)', textAlign: 'center', textTransform: 'uppercase' }}>subscribe to the dispatch · get every prize reveal first</div>

        <style>{`@media (max-width:1100px){.prize-specs{grid-template-columns:repeat(2,1fr)!important}.prize-specs>div:nth-child(2n){border-right:none!important}.prize-specs>div{border-bottom:1px solid var(--line)}}@media (max-width:760px){.side-prizes{grid-template-columns:repeat(2,1fr)!important}}`}</style>
      </div>
    </section>
  );
}
