'use client';
// Nav + Hero, ported from hero.jsx. Register CTAs route to /register.
import * as React from 'react';
import { Css } from '@/components/Css';
import Link from 'next/link';
import { NexGenMark, Countdown, Placeholder, RegisterCta, useGrandPrize } from './primitives';
import { REGISTRATION_CLOSES, REGISTRATION_CLOSES_TIME, GRAND_PRIZE_SEALED } from '@/data/static';
import { AnnouncementBanner } from './Announce';

const NAV_LINKS = [
  { label: 'FORMAT', href: '#format' }, { label: 'CLUBS', href: '#clubs' },
  { label: 'QUALIFIERS', href: '#bracket' }, { label: 'PRIZE', href: '#prize' },
  { label: 'SCHEDULE', href: '#schedule' }, { label: 'PARTNERS', href: '#partners' },
];

export function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 'var(--rail-h)', backdropFilter: scrolled ? 'blur(14px) saturate(150%)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(150%)' : 'none', background: scrolled ? 'rgba(5,7,12,0.72)' : 'transparent', borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent', transition: 'all .3s ease' }}>
      <div className="wrap" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NexGenMark size={56} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: '.24em', color: 'var(--ink-3)' }}>NEXGEN PLC</span>
            <span style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 14, letterSpacing: '.02em', color: 'var(--ink)', marginTop: 2 }}>
              ELECTROCUP <span style={{ color: 'var(--accent-glow)' }}>26</span>
            </span>
          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="mono nav-link" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-2)', padding: '6px 0', borderBottom: '1px solid transparent', transition: 'all .15s ease' }}>{l.label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="tag" style={{ color: 'var(--accent-glow)', borderColor: 'rgba(var(--accent-glow-rgb),0.35)' }}>ANNOUNCING · 2026 · REGISTRATION OPEN</span>
          <RegisterCta className="btn" style={{ padding: '10px 18px', fontSize: 11 }} />
        </div>
      </div>
      <Css>{`.nav-link:hover{color:var(--ink)!important;border-color:var(--accent)!important}@media (max-width:980px){.nav-links{display:none!important}}`}</Css>
    </nav>
  );
}

export function Hero() {
  const prize = useGrandPrize();
  return (
    <section id="top" style={{ position: 'relative', minHeight: '100vh', paddingTop: 'calc(var(--rail-h) + 36px)', paddingBottom: 64, overflow: 'hidden', background: 'radial-gradient(1200px 600px at 80% 0%, rgba(var(--accent-rgb),0.18) 0%, transparent 60%),radial-gradient(900px 500px at 10% 100%, rgba(var(--accent-deep-rgb),0.18) 0%, transparent 55%),linear-gradient(180deg, var(--bg) 0%, var(--bg-1) 50%, var(--bg) 100%)' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none', maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 'var(--scan-opacity, 0.10)', backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.7) 0 1px, transparent 1px 3px)', mixBlendMode: 'overlay' }} />
      <SideRail side="left" /><SideRail side="right" />
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        {/* Renders nothing until a phase is marked justAnnounced, so it can live
            here permanently without affecting the hero's layout in the meantime. */}
        <AnnouncementBanner />
        <div data-reveal style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 28, borderBottom: '1px solid var(--line)', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="eyebrow-accent">NEXGEN PLC PRESENTS</span>
            <span style={{ width: 1, height: 14, background: 'var(--line-strong)' }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)' }}>ADDIS ABABA · ETHIOPIA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)' }}>EDITION 01 · FC 26</span>
            <span style={{ width: 1, height: 14, background: 'var(--line-strong)' }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)' }}>SEASON 2026/27</span>
          </div>
        </div>
        <div data-reveal aria-hidden style={{ marginTop: 14, height: 3, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          <span style={{ background: 'var(--accent)' }} /><span style={{ background: 'var(--accent-2)' }} /><span style={{ background: 'var(--accent-3)' }} />
        </div>
        <HeroDefault />
        <div data-reveal style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', paddingTop: 22, paddingBottom: 22 }} className="hero-metrics">
          <Metric kicker="EDITION" value="01" sub="Inaugural · FC 26" />
          <Metric kicker="CLUB SLOTS" value="20" sub="All open" />
          <Metric kicker="GAMEWEEKS" value="38" sub="Round-robin season" />
          <Metric kicker="GRAND PRIZE" value="1 CAR" sub={prize ? prize.short : "Sealed · reveal on broadcast"} accent />
        </div>
      </div>
      <Css>{`@media (max-width:760px){.hero-metrics{grid-template-columns:repeat(2,1fr)!important;row-gap:24px!important}}`}</Css>
    </section>
  );
}

function SideRail({ side }: { side: 'left' | 'right' }) {
  return (
    <div style={{ position: 'absolute', top: 'var(--rail-h)', bottom: 0, [side]: 0, width: 28, borderInlineEnd: side === 'left' ? '1px solid var(--line)' : 'none', borderInlineStart: side === 'right' ? '1px solid var(--line)' : 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 18, pointerEvents: 'none' } as React.CSSProperties}>
      <span className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-4)', writingMode: 'vertical-rl', transform: side === 'left' ? 'rotate(180deg)' : 'none' }}>
        {side === 'left' ? 'ELECTROCUP · 26 · FC26 · NATIONAL EDITION' : 'EARN YOUR CLUB · DRIVE THE PRIZE · 38 GAMEWEEKS'}
      </span>
    </div>
  );
}

function Metric({ kicker, value, sub, accent }: { kicker: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ paddingInline: 18, borderRight: '1px solid var(--line)' }} className="metric-cell">
      <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)', marginBottom: 8 }}>{kicker}</div>
      <div className="display num" style={{ fontSize: 32, lineHeight: 1, color: accent ? 'var(--accent-glow)' : 'var(--ink)' }}>{value}</div>
      {sub && <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '.06em' }}>{sub}</div>}
      <Css>{`.metric-cell:last-child{border-right:none!important}@media (max-width:760px){.metric-cell:nth-child(2n){border-right:none!important}}`}</Css>
    </div>
  );
}

function HeroDefault() {
  const prize = useGrandPrize();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 56, marginTop: 56, alignItems: 'center' }} className="hero-grid">
      <div data-reveal>
        <div className="marker" style={{ marginBottom: 22 }}>FILE/01 · BROADCAST</div>
        <h1 className="display" style={{ fontSize: 'clamp(72px, 13vw, 200px)', margin: 0 }}>
          ELECTRO<span style={{ color: 'var(--accent-glow)' }}>·</span>CUP<br />
          <span style={{ display: 'inline-block', background: 'linear-gradient(180deg, var(--ink) 0%, var(--chrome-2) 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontStyle: 'italic' }}>26</span>
          <span style={{ display: 'inline-block', verticalAlign: 'top', fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-3)', letterSpacing: '.24em', marginLeft: 14, marginTop: 18 }}>EC/26</span>
        </h1>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 'clamp(20px, 2.4vw, 30px)', letterSpacing: '-0.01em', color: 'var(--ink)' }}>EARN YOUR CLUB.</span>
          <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 'clamp(20px, 2.4vw, 30px)', letterSpacing: '-0.01em', color: 'var(--ink-3)', fontStyle: 'italic' }}>DRIVE THE PRIZE.</span>
        </div>
        <p style={{ marginTop: 24, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: '52ch' }}>
          Ethiopia&apos;s first national FC&nbsp;26 league. Twenty Premier League clubs. One slot per club. Earn your seat through open qualifiers — then play a full 38-gameweek season for the title and <strong style={{ color: 'var(--ink)' }}>{prize ? prize.name : 'a brand-new 100% electric car'}</strong>.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
          <RegisterCta className="btn" label="REGISTER NOW →" />
          <a href="#format" className="btn-ghost">HOW IT WORKS</a>
        </div>
      </div>
      <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <CountdownPanel target={REGISTRATION_CLOSES} />
        <PrizeTeaser />
      </div>
      <Css>{`@media (max-width:1100px){.hero-grid{grid-template-columns:1fr!important;gap:40px!important}}`}</Css>
    </div>
  );
}

function CountdownPanel({ target }: { target: number }) {
  return (
    <div className="ticks" style={{ position: 'relative', padding: 24, background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))', border: '1px solid var(--line-2)' }}>
      <span className="tk1" /><span className="tk2" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>REGISTRATION</div>
          <div className="display-2" style={{ fontSize: 22, marginTop: 4, fontWeight: 800, letterSpacing: '.02em' }}>CLOSES IN</div>
        </div>
        <span className="tag" style={{ color: 'var(--accent-glow)', borderColor: 'rgba(var(--accent-glow-rgb),0.35)' }}>SIGN-UP CLOSING</span>
      </div>
      <Countdown target={target} />
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px dashed var(--line-2)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '.14em', color: 'var(--ink-3)' }}>CLOSES {REGISTRATION_CLOSES_TIME}</span>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '.14em', color: 'var(--ink-3)' }}>20 CLUB BRACKETS · ETHIOPIA</span>
      </div>
    </div>
  );
}

function PrizeTeaser() {
  const prize = useGrandPrize();
  return (
    <a href="#prize" className="ticks prize-teaser" style={{ position: 'relative', display: 'block', padding: 24, color: 'inherit', background: 'linear-gradient(135deg, rgba(var(--accent-glow-rgb),0.08), rgba(var(--accent-glow-rgb),0.0) 40%),var(--bg-1)', border: '1px solid var(--line-2)', transition: 'border-color .15s ease' }}>
      <span className="tk1" /><span className="tk2" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>GRAND PRIZE / 01</span>
      </div>
      <div className="display-2" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.05 }}>{prize ? prize.name : <>AN <span style={{ fontStyle: 'italic', color: 'var(--accent-glow)' }}>ELECTRIC</span> CAR</>}</div>
      <div style={{ marginTop: 16 }}><Placeholder label={(prize ?? GRAND_PRIZE_SEALED).plate} aspect="16 / 6" /></div>
      {/* Sealed: only the two facts that are actually known. A field with a
          redacted value still tells a reader a number is being withheld;
          omitting it says nothing at all, which is what "sealed" should mean. */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: prize ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
        {(prize ? prize.teaserSpecs : [
          { k: 'TYPE', v: '100% EV' },
          { k: 'STATUS', v: GRAND_PRIZE_SEALED.status },
        ]).map((c) => (
          <div key={c.k}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-3)' }}>{c.k}</div>
            <div className="display-2" style={{ fontSize: prize ? 17 : 13, fontWeight: 700, marginTop: 2, lineHeight: 1.2 }}>{c.v}</div>
          </div>
        ))}
      </div>
      <Css>{`.prize-teaser:hover{border-color:var(--accent)!important}`}</Css>
    </a>
  );
}
