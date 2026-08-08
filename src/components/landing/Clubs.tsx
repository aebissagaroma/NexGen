'use client';
// Clubs grid, ported from clubs.jsx. Reads live registration counts from the API
// (falls back to the static list on first paint / if the API is unavailable).
//
// Split into two closing groups. Group A is last season's top ten and closes
// first, when its draw is announced; Group B stays open after that, so anyone
// knocked out of a Group A bracket can enter one there. Both are open from the
// moment sign-ups start — the split is about when they CLOSE, and the copy has
// to keep saying so, because "closes first" reads as "not open yet" otherwise.
import * as React from 'react';
import { Css } from '@/components/Css';
import Link from 'next/link';
import { ClubCode, useRegistrationPhase } from './primitives';
import {
  CLUBS as STATIC_CLUBS, REGISTRATION_OPENS_LABEL, REGISTRATION_OPENS_SHORT,
  REGISTRATION_OPENS_TIME, type ClubGroup, type RegistrationPhase,
} from '@/data/static';

interface ClubRow { code: string; name: string; city: string; regs?: number; group?: ClubGroup; standIn?: string; }

const GROUP_HEADS: Record<ClubGroup, string> = {
  A: 'GROUP A · TOP TEN FINISHERS 2025/26 · CLOSES FIRST',
  B: 'GROUP B · 11TH TO 17TH AND THE PROMOTED CLUBS · STAYS OPEN LONGER',
};

export function ClubsSection() {
  const [clubs, setClubs] = React.useState<ClubRow[]>(STATIC_CLUBS);
  const phaseA = useRegistrationPhase('A');
  const phaseB = useRegistrationPhase('B');
  const anyOpen = phaseA === 'open' || phaseB === 'open';

  React.useEffect(() => {
    fetch('/api/clubs').then((r) => r.json()).then((d) => { if (d.clubs?.length) setClubs(d.clubs); }).catch(() => {});
  }, []);

  // Real database numbers only — never a placeholder or a hard-coded figure.
  const totalRegs = clubs.reduce((s, c) => s + (c.regs ?? 0), 0);

  // The API row carries the group; the static fallback already has it. Falling
  // back to the static record keeps the grouping correct on first paint.
  const groupOf = (c: ClubRow): ClubGroup =>
    c.group ?? STATIC_CLUBS.find((s) => s.code === c.code)?.group ?? 'B';
  const standInOf = (c: ClubRow): string | undefined =>
    c.standIn ?? STATIC_CLUBS.find((s) => s.code === c.code)?.standIn;

  const inGroup = (g: ClubGroup) => clubs.filter((c) => groupOf(c) === g);

  const notice =
    phaseA === 'closed' && phaseB === 'open'
      ? 'THE TOP-TEN BRACKETS ARE CLOSED · TEN CLUBS REMAIN OPEN · KNOCKED OUT IN A TOP-TEN BRACKET? ENTER AGAIN HERE'
      : anyOpen
        ? 'REGISTRATION IS OPEN · THE TOP-TEN BRACKETS CLOSE WHEN THEIR DRAW IS ANNOUNCED · NO DATE GIVEN IN ADVANCE · THE OTHER TEN STAY OPEN LONGER'
        : phaseA === 'before'
          ? `QUALIFIER REGISTRATION OPENS ${REGISTRATION_OPENS_TIME}`
          : 'QUALIFIER REGISTRATION IS CLOSED';

  return (
    <section id="clubs" className="section" style={{ background: 'var(--bg-1)' }}>
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div className="section-head-row">
            <div>
              <div className="marker">FILE/03 · CLUB SLOTS</div>
              <h2 className="section-title" style={{ marginTop: 16 }}>TWENTY SLOTS.<br /><span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>TWO GROUPS.</span></h2>
            </div>
            <div style={{ alignSelf: 'flex-end', textAlign: 'right' }}>
              <div className="display num" style={{ fontSize: 56, lineHeight: 1, color: 'var(--accent-glow)' }}>20/20</div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)', marginTop: 6 }}>CLUB SLOTS · {totalRegs} {totalRegs === 1 ? 'ENTRY' : 'ENTRIES'} · {anyOpen ? 'REGISTRATION OPEN' : phaseA === 'before' ? `OPENS ${REGISTRATION_OPENS_LABEL}` : 'CLOSED'}</div>
            </div>
          </div>
        </div>

        <div data-reveal style={{ marginBottom: 24, padding: '12px 18px', border: '1px solid var(--line-2)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>NOTICE</span>
            <span style={{ width: 1, height: 12, background: 'var(--line-strong)' }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '.10em', color: 'var(--ink-2)' }}>{notice}</span>
          </div>
          {anyOpen
            ? <Link href="/register" className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink)', textTransform: 'uppercase', borderBottom: '1px solid var(--accent)', paddingBottom: 2 }}>REGISTER →</Link>
            : <span className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)' }}>{phaseA === 'before' ? 'NOT YET OPEN' : 'REGISTRATION CLOSED'}</span>}
        </div>

        {(['A', 'B'] as ClubGroup[]).map((g) => {
          const rows = inGroup(g);
          const phase = g === 'A' ? phaseA : phaseB;
          if (rows.length === 0) return null;
          return (
            <div key={g} style={{ marginBottom: g === 'A' ? 44 : 0 }}>
              <div data-reveal style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.20em', color: phase === 'closed' ? 'var(--ink-3)' : 'var(--accent-glow)' }}>{GROUP_HEADS[g]}</span>
                <span style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
                <span className="mono" style={{ fontSize: 10, letterSpacing: '.18em', color: 'var(--ink-3)' }}>
                  {phase === 'closed' ? 'CLOSED · DRAWN' : phase === 'before' ? `OPENS ${REGISTRATION_OPENS_SHORT}` : 'OPEN'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }} className="clubs-grid">
                {rows.map((c, i) => (
                  <ClubCell key={c.code} club={c} idx={i} phase={phase} standIn={standInOf(c)} />
                ))}
              </div>

              {g === 'B' && (
                <p className="mono" data-reveal style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)', lineHeight: 1.7, margin: '14px 0 0', maxWidth: '86ch' }}>
                  Qualifiers are played on FC 26, where these three clubs are not selectable, so each uses a stand-in — the club it replaced. You win the club slot itself, and represent your real club from Gameweek 1 on FC 27.
                </p>
              )}
            </div>
          );
        })}

        <div data-reveal style={{ marginTop: 28, display: 'grid', gap: 10, maxWidth: '86ch' }}>
          <p className="mono" style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)', lineHeight: 1.7, margin: 0 }}>
            Groups are set by where each club finished last season. Group A is the top ten; Group B is everyone else, including the three clubs promoted this summer. All twenty are open now.
          </p>
          <p className="mono" style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)', lineHeight: 1.7, margin: 0 }}>
            Group A closes first, when its bracket draw is announced — no date is given in advance. Group B stays open after that, and anyone knocked out in a Group A bracket can enter a Group B bracket for another session fee. Fewer entrants there, but many of them have already won matches.
          </p>
        </div>
      </div>
      <Css>{`@media (max-width:1100px){.clubs-grid{grid-template-columns:repeat(3,1fr)!important}}@media (max-width:760px){.clubs-grid{grid-template-columns:repeat(2,1fr)!important}}@media (max-width:460px){.clubs-grid{grid-template-columns:1fr!important}}`}</Css>
    </section>
  );
}

function ClubCell({ club, idx, phase, standIn }: { club: ClubRow; idx: number; phase: RegistrationPhase; standIn?: string }) {
  const [hovered, setHovered] = React.useState(false);
  const open = phase === 'open';
  const regs = club.regs ?? 0;

  const body = (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, height: 2, width: hovered && open ? '100%' : '20%', background: 'var(--accent)', transition: 'width .35s cubic-bezier(.2,.7,.2,1)', boxShadow: '0 0 12px var(--accent)', opacity: hovered && open ? 1 : 0.4 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <ClubCode code={club.code} />
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.22em', color: open ? 'var(--accent-glow)' : 'var(--ink-3)', fontWeight: 600 }}>
          {open ? 'OPEN' : phase === 'before' ? `OPENS ${REGISTRATION_OPENS_SHORT}` : 'CLOSED · DRAWN'}
        </span>
      </div>
      <div className="display-2" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.05, color: 'var(--ink)', minHeight: standIn ? 'auto' : 44 }}>{club.name}</div>
      {standIn && (
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.08em', color: 'var(--ink-4)', marginTop: 5, lineHeight: 1.5 }}>
          Qualifiers played as {standIn}
        </div>
      )}
      <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--ink-3)', marginTop: 4 }}>{club.city.toUpperCase()}</div>
      <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px dashed var(--line-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.18em', color: 'var(--ink-3)' }}>
          {regs > 0 ? `${regs} ENTERED` : 'AWAITING ENTRANTS'}
        </span>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.18em', color: hovered && open ? 'var(--accent-glow)' : 'var(--ink-3)', transition: 'color .15s ease' }}>
          {open ? 'ENTER →' : phase === 'before' ? `OPENS ${REGISTRATION_OPENS_SHORT}` : 'CLOSED · DRAWN'}
        </span>
      </div>
    </>
  );

  const style: React.CSSProperties = {
    background: hovered && open ? 'var(--bg-2)' : 'var(--bg)', padding: 22, position: 'relative',
    transition: 'background .2s ease', transitionDelay: `${Math.min(idx, 12) * 30}ms`,
    display: 'block', color: 'inherit',
    // Drawn brackets are dimmed as well as disabled: the card has to read as
    // finished at a glance, not as a button that failed to work.
    opacity: phase === 'closed' ? 0.45 : 1,
  };

  // Nothing to enter, so this becomes a plain card rather than a link — walking
  // someone into a form that would turn them away is worse than saying so here.
  // The server rejects the same case; this is the courtesy, not the enforcement.
  if (!open) {
    return <div data-reveal style={{ ...style, cursor: 'default' }}>{body}</div>;
  }

  return (
    <Link href={`/register?club=${club.code}`} data-reveal onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={style}>
      {body}
    </Link>
  );
}
