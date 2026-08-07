'use client';
// Bracket section (Day-Zero empty state), ported from bracket.jsx.
import * as React from 'react';
import { Css } from '@/components/Css';
import Link from 'next/link';
import { RegisterCta } from './primitives';

const ROUNDS = [
  // Dates are announced phase by phase, so every milestone reads TBA until then.
  // Named by stage, not by field size: the number of rounds in a bracket is not
  // known until the draw, because it depends on how many entered that club.
  { round: 'ROUND 1', date: 'TBA' }, { round: 'MIDDLE ROUNDS', date: 'TBA' },
  { round: 'RD 16', date: 'TBA' }, { round: 'QFs', date: 'TBA' }, { round: 'FINAL', date: 'TBA' },
];

export function BracketSection() {
  return (
    <section id="bracket" className="section" style={{ background: 'var(--bg)', backgroundImage: 'radial-gradient(800px 400px at 90% 0%, rgba(var(--accent-rgb),0.08), transparent 60%)' }}>
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div className="section-head-row">
            <div>
              <div className="marker">FILE/04 · BRACKETS</div>
              <h2 className="section-title" style={{ marginTop: 16 }}>THE PATH<br /><span style={{ color: 'var(--accent-glow)' }}>FROM ENTRY</span> <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>TO</span><br />CLUB REP.</h2>
            </div>
            <p className="section-sub" style={{ alignSelf: 'flex-end' }}>Each club bracket is a single-elimination knockout, BO3 throughout. The top-ten brackets <strong style={{ color: 'var(--ink)' }}>close the moment their draw is announced</strong>, then draw at random live on broadcast. The other ten stay open until their own draw is called. No closing date is published in advance — enter early.</p>
          </div>
        </div>

        <div data-reveal style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 24 }}>
          {ROUNDS.map((r, i) => (
            <div key={i} style={{ padding: '12px 14px', borderLeft: i === 0 ? '1px solid var(--line)' : 'none', borderRight: '1px solid var(--line)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.22em', color: 'var(--ink-3)' }}>{String(i + 1).padStart(2, '0')} · UPCOMING</div>
              <div className="display-2" style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{r.round}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '.14em', marginTop: 4 }}>{r.date === 'TBA' ? 'TBA' : `${r.date} · 2026`}</div>
            </div>
          ))}
        </div>

        <div data-reveal className="ticks" style={{ position: 'relative', border: '1px solid var(--line-2)', background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 14px),linear-gradient(180deg, var(--bg-1), var(--bg))', minHeight: 380, padding: '60px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
          <span className="tk1" /><span className="tk2" />
          <span className="mono" style={{ fontSize: 10, letterSpacing: '.26em', color: 'var(--accent-glow)' }}>BRACKET DATA · NOT YET DRAWN</span>
          <h3 className="display" style={{ fontSize: 'clamp(40px, 6vw, 72px)', margin: 0, lineHeight: 0.95 }}>BRACKETS REVEAL<br /><span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>DATE TBA</span></h3>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6, maxWidth: '52ch', margin: 0 }}>Once qualifier registration closes, all twenty brackets are drawn at random on a single live broadcast. From draw to final, every match is streamed.</p>
          <div style={{ marginTop: 12, width: 'min(560px, 100%)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, opacity: 0.55 }}>
            {[8, 4, 2, 1, 1].map((n, col) => (
              <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Array.from({ length: n }).map((_, j) => (
                  <div key={j} style={{ height: col === 4 ? 28 : 14, border: '1px dashed var(--line-2)', background: col === 4 ? 'rgba(var(--accent-rgb),0.05)' : 'transparent' }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <RegisterCta className="btn" style={{ padding: '12px 20px', fontSize: 12 }} />
            <Link href="/bracket" className="btn-ghost" style={{ padding: '12px 20px', fontSize: 12 }}>VIEW BRACKETS</Link>
          </div>
        </div>

        <div data-reveal style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--line)' }} className="bracket-rail">
          {[{ k: 'FORMAT', v: 'BO3 · KO' }, { k: 'ROUNDS', v: 'SET AT DRAW' }, { k: 'SEEDING', v: 'RANDOM DRAW' }, { k: 'BROADCAST', v: 'TIKTOK · YT · IG' }].map((r, i) => (
            <div key={r.k} style={{ padding: '20px 22px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }} className="rail-cell">
              <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>{r.k}</div>
              <div className="display-2" style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{r.v}</div>
            </div>
          ))}
        </div>
        <Css>{`@media (max-width:760px){.bracket-rail{grid-template-columns:repeat(2,1fr)!important}.bracket-rail .rail-cell:nth-child(2n){border-right:none!important}.bracket-rail .rail-cell{border-bottom:1px solid var(--line)}}`}</Css>
      </div>
    </section>
  );
}
