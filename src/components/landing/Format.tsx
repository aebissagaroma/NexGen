'use client';
// Format explainer, ported from format.jsx.
import * as React from 'react';
import { Css } from '@/components/Css';
import { Placeholder } from './primitives';

interface Step { n: string; kicker: string; title: string; sub: string; blurb: string; meta: { k: string; v: string }[]; state: string; }

const STEPS: Step[] = [
  { n: '01', kicker: 'PHASE ONE', title: 'QUALIFIERS', sub: 'OPEN NATIONAL BRACKETS', blurb: 'Sign up for any club you want to represent. Each club runs its own knockout bracket — best of three, single elimination — until one player wins the slot.', meta: [{ k: 'FORMAT', v: 'BO3 KO' }, { k: 'ENTRY', v: 'TBA' }, { k: 'BRACKETS', v: '20' }, { k: 'OPENS', v: 'SEP 01' }], state: 'upcoming' },
  { n: '02', kicker: 'PHASE TWO', title: 'DRAFT DAY', sub: '20 SLOTS · 1 BROADCAST', blurb: 'On Draft Day all 20 winners are announced on a single live broadcast. Each is paired with their Premier League club for the season — jersey reveal, profile film, and seeding.', meta: [{ k: 'DATE', v: 'TBA' }, { k: 'VENUE', v: 'TBA' }, { k: 'BROADCAST', v: 'TIKTOK · YT · IG' }, { k: 'STATUS', v: 'LOCKED' }], state: 'upcoming' },
  { n: '03', kicker: 'PHASE THREE', title: 'SEASON', sub: '38 GAMEWEEKS · ROUND ROBIN', blurb: 'All 20 players play each other home and away — exactly 38 fixtures each. League table, top scorer race, GW awards, and a televised final at the host venue.', meta: [{ k: 'FIXTURES', v: '380' }, { k: 'WEEKS', v: '38' }, { k: 'KICKOFF', v: 'TBA' }, { k: 'FINAL', v: 'TBA' }], state: 'upcoming' },
];

export function FormatSection({ ps5Mood = true }: { ps5Mood?: boolean }) {
  return (
    <section id="format" className="section" style={{ background: 'var(--bg)' }}>
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div className="section-head-row">
            <div>
              <div className="marker">FILE/02 · FORMAT</div>
              <h2 className="section-title" style={{ marginTop: 16 }}>THE PATH<br /><span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>TO THE TROPHY.</span></h2>
            </div>
            <p className="section-sub" style={{ alignSelf: 'flex-end' }}>Three phases. Open to anyone in Ethiopia — you don&apos;t need to own FC&nbsp;26, a console or a controller. Win your bracket, claim your club, then play the longest competitive FC&nbsp;26 season ever run on the continent.</p>
          </div>
        </div>

        {ps5Mood && (
          <div data-reveal style={{ marginBottom: 32, position: 'relative', border: '1px solid var(--line-2)', background: 'var(--bg-1)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>QUALIFIER CENTER · TOURNAMENT HARDWARE</span>
                <span style={{ width: 1, height: 12, background: 'var(--line-strong)' }} />
                <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>NO CONSOLE OR FC 26 PURCHASE REQUIRED</span>
              </div>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>EC26 / OPS / HW.01</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 0 }} className="ps5-row">
              <div style={{ position: 'relative', background: 'radial-gradient(circle at 50% 60%, rgba(var(--accent-glow-rgb),0.14), transparent 65%),linear-gradient(180deg, var(--bg-1), var(--bg))', padding: 8, borderRight: '1px solid var(--line)' }}>
                <Placeholder label="[ PS5 + DUALSENSE SETUP ]" aspect="16 / 7" />
              </div>
              <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>IDENTICAL HARDWARE · EVERY MATCH</div>
                <div className="display" style={{ fontSize: 28, lineHeight: 1, color: 'var(--ink)' }}>TURN UP.<br />SIGN IN.<br />PLAY.</div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>Every qualifier match plays on tournament-supplied PS5 hardware at official Qualifier Centers across Ethiopia. Same console, same controller, same conditions — for everyone.</p>
              </div>
            </div>
            <Css>{`@media (max-width:820px){.ps5-row{grid-template-columns:1fr!important}.ps5-row>div:first-child{border-right:none!important;border-bottom:1px solid var(--line)}}`}</Css>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }} className="format-grid">
          {STEPS.map((s, i) => <PhaseCard key={s.n} step={s} idx={i} />)}
        </div>

        <div data-reveal style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 0, border: '1px solid var(--line)' }} className="format-rail">
          <DetailCell title="ELIGIBILITY" body="Ethiopia residents · 16+ · No game, console or controller needed. Valid photo ID required at registration to confirm your age. Winners under 18 receive the grand prize through a parent or legal guardian." />
          <DetailCell title="MATCH RULES" body="Match length, defending, tactics and squad restrictions are all published before qualifiers begin. Announced soon." />
          <DetailCell title="ANTI-CHEAT" body="All knockouts streamed. Final 3 rounds played on-site. Replay review on protest." />
          <DetailCell title="ENTRY FEE" body="Qualifier entry fee announced soon · subsidised seats for university clubs · zero fee for season play." />
        </div>
      </div>
      <Css>{`@media (max-width:980px){.format-grid{grid-template-columns:1fr!important}.format-rail{grid-template-columns:1fr 1fr!important}}@media (max-width:560px){.format-rail{grid-template-columns:1fr!important}}`}</Css>
    </section>
  );
}

function PhaseCard({ step, idx }: { step: Step; idx: number }) {
  const { n, kicker, title, sub, blurb, meta, state } = step;
  return (
    <div data-reveal style={{ background: 'var(--bg)', padding: 32, position: 'relative', transitionDelay: `${idx * 80}ms` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <span className="display num" style={{ fontSize: 96, lineHeight: 0.85, color: 'var(--ink-4)' }}>{n}</span>
        {state === 'live' ? <span className="tag tag-live" style={{ marginTop: 6 }}>LIVE</span> : <span className="tag" style={{ marginTop: 6, color: 'var(--ink-3)' }}>UPCOMING</span>}
      </div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)', marginTop: 6 }}>{kicker}</div>
      <h3 className="display" style={{ fontSize: 44, margin: '8px 0 6px', color: 'var(--ink)' }}>{title}</h3>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--accent-glow)', marginBottom: 18 }}>{sub}</div>
      <p style={{ color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.6 }}>{blurb}</p>
      <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px dashed var(--line-2)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {meta.map((m) => (
          <div key={m.k}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.22em', color: 'var(--ink-3)' }}>{m.k}</div>
            <div className="display-2" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailCell({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: '22px 24px', borderRight: '1px solid var(--line)' }} className="detail-cell">
      <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)', marginBottom: 10 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>{body}</p>
      <Css>{`.detail-cell:last-child{border-right:none!important}`}</Css>
    </div>
  );
}
