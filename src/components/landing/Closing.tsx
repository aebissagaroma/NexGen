'use client';
// Closing sections (Schedule, Sponsors + inquiry form, About, RegisterCTA, Footer).
// Ported from closing.jsx; the sponsor CTA is now a working form → /api/sponsors.
import * as React from 'react';
import { Css } from '@/components/Css';
import Link from 'next/link';
import { NexGenMark, Countdown, RegisterCta } from './primitives';
import { TIMELINE, SPONSORS_TIERS, NEXGEN_PILLARS, REGISTRATION_OPENS } from '@/data/static';
import { NotifyBox } from './Announce';

export function ScheduleSection() {
  return (
    <section id="schedule" className="section" style={{ background: 'var(--bg)' }}>
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div className="section-head-row">
            <div>
              <div className="marker">FILE/06 · CALENDAR</div>
              <h2 className="section-title" style={{ marginTop: 16 }}>NINE MONTHS.<br /><span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>ONE</span> CHAMPION.</h2>
            </div>
            <p className="section-sub" style={{ alignSelf: 'flex-end' }}>Registration opens 01 September 2026. Each phase after that — the bracket draw, qualifiers, Draft Day and the season — is announced as it approaches, so check back or register to be told first.</p>
          </div>
        </div>
        <div data-reveal style={{ display: 'grid', gridTemplateColumns: `repeat(${TIMELINE.length}, 1fr)`, gap: 0, border: '1px solid var(--line)', background: 'var(--bg-1)', position: 'relative' }} className="timeline-grid">
          {TIMELINE.map((t, i) => (
            <div key={t.phase} style={{ padding: '28px 18px 24px', borderRight: i < TIMELINE.length - 1 ? '1px solid var(--line)' : 'none', position: 'relative', background: t.state === 'live' ? 'rgba(var(--accent-rgb),0.05)' : 'transparent' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.state === 'live' ? 'var(--accent)' : 'var(--line-2)', boxShadow: t.state === 'live' ? '0 0 12px var(--accent)' : 'none' }} />
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.22em', color: t.state === 'live' || t.justAnnounced ? 'var(--accent-glow)' : 'var(--ink-3)' }}>{String(i + 1).padStart(2, '0')} · {t.justAnnounced ? 'JUST ANNOUNCED' : t.state === 'live' ? 'NOW' : 'NEXT'}</div>
              <div className="display-2" style={{ fontSize: 18, fontWeight: 800, marginTop: 10, lineHeight: 1.1 }}>{t.phase}</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--ink-3)', marginTop: 4 }}>{t.sub.toUpperCase()}</div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.10em', marginTop: 18, color: t.state === 'live' ? 'var(--ink)' : 'var(--ink-2)' }}>{t.date}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '.08em', marginTop: 6, lineHeight: 1.4 }}>{t.note}</div>
            </div>
          ))}
        </div>
        {/* Sits directly under the strip: this is where a visitor first sees how
            many phases read TBA, and so where they are most likely to want one. */}
        <NotifyBox />
        <Css>{`@media (max-width:1100px){.timeline-grid{grid-template-columns:repeat(2,1fr)!important}.timeline-grid>div{border-right:1px solid var(--line)!important;border-bottom:1px solid var(--line)}.timeline-grid>div:nth-child(2n){border-right:none!important}}@media (max-width:560px){.timeline-grid{grid-template-columns:1fr!important}}`}</Css>
      </div>
    </section>
  );
}

export function SponsorsSection() {
  return (
    <section id="partners" className="section" style={{ background: 'var(--bg-1)' }}>
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div className="section-head-row">
            <div>
              <div className="marker">FILE/07 · PARTNERS</div>
              <h2 className="section-title" style={{ marginTop: 16 }}>BUILT WITH<br /><span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>BRANDS</span> THAT MOVE<br />ETHIOPIA.</h2>
            </div>
            <p className="section-sub" style={{ alignSelf: 'flex-end' }}>ELECTROCUP 26 is delivered with a tiered partner system covering vehicle, banking, telecom, hospitality and broadcast. Reach an audience of 18–34 across Ethiopia for nine months of consistent programming.</p>
          </div>
        </div>

        <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
          {SPONSORS_TIERS.map((tier) => (
            <div key={tier.tier} style={{ background: 'var(--bg)', padding: '26px 26px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, alignItems: 'center' }} className="sponsor-row">
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>{tier.code}</div>
                <div className="display-2" style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{tier.tier.toUpperCase()}</div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--ink-3)', marginTop: 4 }}>{tier.seats} SEAT{tier.seats > 1 ? 'S' : ''} · ALL OPEN</div>
                <p style={{ margin: '10px 0 0', color: 'var(--ink-3)', fontSize: 12, lineHeight: 1.5, maxWidth: '32ch' }}>{tier.note}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {tier.items.map((it, i) => (
                  <div key={i} className="stripe ticks" style={{ position: 'relative', padding: '18px 18px', border: '1px dashed var(--line-2)', background: 'var(--bg-1)', minHeight: 76, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                    <span className="tk1" /><span className="tk2" />
                    <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 600, fontSize: 11, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>{it.name}</div>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--ink-3)' }}>{it.sub.toUpperCase()} · OPEN</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Css>{`@media (max-width:760px){.sponsor-row{grid-template-columns:1fr!important;gap:18px!important}}`}</Css>
        </div>

        <SponsorInquiry />
      </div>
    </section>
  );
}

function SponsorInquiry() {
  const [sent, setSent] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/sponsors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: fd.get('company'), contactName: fd.get('contactName'),
        email: fd.get('email'), phone: fd.get('phone'), tier: fd.get('tier'), message: fd.get('message'),
      }),
    });
    setBusy(false);
    if (res.ok) setSent(true);
    else setErr((await res.json().catch(() => ({}))).error || 'Something went wrong.');
  }

  return (
    <div data-reveal className="ticks" style={{ position: 'relative', marginTop: 32, border: '1px solid var(--line-2)', background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.08), transparent 50%),var(--bg)', padding: 'clamp(24px, 4vw, 40px)' }}>
      <span className="tk1" /><span className="tk2" />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)', marginBottom: 8 }}>FOUNDING PARTNERS / 2026</div>
          <div className="display-2" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}><span style={{ color: 'var(--accent-glow)' }}>12 SEATS</span> AVAILABLE · <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>BE THE FIRST.</span></div>
        </div>
      </div>
      {sent ? (
        <div className="notice notice-ok">Thank you — we&apos;ve logged your interest. The partnerships team will reach out with the media kit.</div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="sponsor-form">
          <div><label className="label">Company</label><input name="company" required className="field" placeholder="Company name" /></div>
          <div><label className="label">Contact name</label><input name="contactName" required className="field" placeholder="Full name" /></div>
          <div><label className="label">Email</label><input name="email" type="email" required className="field" placeholder="you@company.com" /></div>
          <div><label className="label">Phone (optional)</label><input name="phone" className="field" placeholder="+251…" /></div>
          <div><label className="label">Tier of interest</label>
            <select name="tier" className="field" defaultValue="">
              <option value="">Any / not sure</option>
              <option>Title</option><option>Platinum</option><option>Gold</option><option>Broadcast</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}><label className="label">Message (optional)</label><textarea name="message" className="field" style={{ height: 96, padding: '12px 14px', resize: 'vertical' }} placeholder="Tell us about your brand and goals" /></div>
          {err && <div className="notice notice-err" style={{ gridColumn: '1 / -1' }}>{err}</div>}
          <div style={{ gridColumn: '1 / -1' }}><button className="btn" disabled={busy}>{busy ? 'SENDING…' : 'REQUEST MEDIA KIT →'}</button></div>
          <Css>{`@media (max-width:640px){.sponsor-form{grid-template-columns:1fr!important}}`}</Css>
        </form>
      )}
    </div>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="section" style={{ background: 'var(--bg)' }}>
      <div className="wrap">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 64 }} className="about-grid" data-reveal>
          <div>
            <div className="marker">FILE/08 · COMPANY</div>
            <h2 className="display" style={{ fontSize: 'clamp(48px, 6vw, 88px)', margin: '16px 0 24px', lineHeight: 0.95 }}>ABOUT<br /><span style={{ background: 'linear-gradient(180deg, var(--ink), var(--chrome-2))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>NEXGEN</span> <span style={{ color: 'var(--accent-glow)' }}>PLC.</span></h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.65, maxWidth: '44ch' }}>NexGen PLC is an Ethiopian esports and entertainment company building national-scale competitive platforms, broadcast productions and youth programming. ELECTROCUP 26 is our debut tournament — and the first of many.</p>
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid var(--line)' }}>
              {[{ k: 'FOUNDED', v: '2025 · ADDIS ABABA' }, { k: 'FOCUS', v: 'ESPORTS · MEDIA · LIVE EVENTS' }, { k: 'REACH', v: 'ETHIOPIA · EAST AFRICA' }, { k: 'TEAM', v: '12 FULL-TIME · 40+ FREELANCE' }].map((r) => (
                <div key={r.k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 20, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
                  <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.22em', color: 'var(--ink-3)' }}>{r.k}</span>
                  <span className="mono" style={{ fontSize: 11.5, letterSpacing: '.10em', color: 'var(--ink)' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)', marginBottom: 16 }}>FOUR PILLARS · ONE COMPANY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
              {NEXGEN_PILLARS.map((p) => (
                <div key={p.code} className="ticks" style={{ position: 'relative', background: 'var(--bg-1)', padding: 26, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span className="tk1" /><span className="tk2" />
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)' }}>PILLAR {p.code}</div>
                  <div className="display" style={{ fontSize: 36, color: 'var(--ink)' }}>{p.name.toUpperCase()}</div>
                  <p style={{ color: 'var(--ink-2)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{p.blurb}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.18em', color: 'var(--ink-3)' }}>ROADMAP — UNIVERSITY LEAGUE / 2027 · MOBILE LEGENDS CUP / 2027</span>
            </div>
          </div>
        </div>
        <Css>{`@media (max-width:980px){.about-grid{grid-template-columns:1fr!important;gap:40px!important}}`}</Css>
      </div>
    </section>
  );
}

export function RegisterCTA() {
  return (
    <section id="register" className="section" style={{ background: 'var(--bg-1)', backgroundImage: 'radial-gradient(900px 500px at 50% 0%, rgba(var(--accent-rgb),0.18), transparent 60%)', paddingBlock: 'clamp(80px, 10vw, 140px)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.45, pointerEvents: 'none', maskImage: 'radial-gradient(ellipse at 50% 50%, black 10%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 10%, transparent 75%)' }} />
      <div className="wrap" style={{ position: 'relative', textAlign: 'center' }} data-reveal>
        <div className="marker" style={{ justifyContent: 'center' }}>FILE/09 · ENTER</div>
        <h2 className="display" style={{ fontSize: 'clamp(64px, 10vw, 144px)', margin: '20px 0 24px', lineHeight: 0.92 }}>EARN <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>YOUR</span> CLUB.<br /><span style={{ background: 'linear-gradient(180deg, var(--ink), var(--chrome-2))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>DRIVE THE PRIZE.</span></h2>
        <p style={{ color: 'var(--ink-2)', fontSize: 17, lineHeight: 1.6, maxWidth: '52ch', margin: '0 auto' }}>Registration opens 01 September 2026. Verify your email, pick your club, and enter its qualifier bracket. Brackets are drawn live on broadcast — we announce the date once sign-ups close.</p>
        <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <RegisterCta className="btn" style={{ padding: '18px 28px', fontSize: 13 }} label="REGISTER NOW →" />
          <a href="#format" className="btn-ghost" style={{ padding: '18px 28px', fontSize: 13 }}>READ THE FORMAT</a>
        </div>
        <div style={{ marginTop: 48, display: 'inline-flex', alignItems: 'center', gap: 14, padding: '12px 18px', border: '1px solid var(--line-2)', borderRadius: 999, background: 'rgba(0,0,0,0.4)' }}>
          <span className="tag tag-live" style={{ border: 0, padding: 0, background: 'transparent' }} />
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.18em', color: 'var(--ink-2)' }}>REGISTRATION OPENS IN</span>
          <Countdown target={REGISTRATION_OPENS} compact />
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  // href null = no destination exists yet, so it renders as plain text rather
  // than a link that goes nowhere. Give these a URL as each one lands.
  const COLS: { title: string; links: { label: string; href: string | null }[] }[] = [
    { title: 'TOURNAMENT', links: [
      { label: 'Format', href: '/#format' },
      { label: 'Clubs', href: '/#clubs' },
      { label: 'Brackets', href: '/#bracket' },
      { label: 'Schedule', href: '/#schedule' },
      { label: 'Prize', href: '/#prize' },
    ] },
    { title: 'COMPANY', links: [
      { label: 'About NexGen', href: '/#about' },
      { label: 'Partners', href: '/#partners' },
      { label: 'Press', href: null },
      { label: 'Careers', href: null },
    ] },
    { title: 'FOLLOW', links: [
      { label: 'TikTok @electrocup26', href: null },
      { label: 'Instagram @electrocup26', href: null },
      { label: 'YouTube /nexgenplc', href: null },
      { label: 'Twitch /electrocup', href: null },
    ] },
  ];
  return (
    <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--line)', padding: '56px 0 36px' }}>
      <div className="wrap">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 32, alignItems: 'flex-start' }} className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <NexGenMark size={32} />
              <div>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.24em', color: 'var(--ink-3)' }}>NEXGEN PLC</div>
                <div className="display-2" style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>ELECTROCUP 26</div>
              </div>
            </div>
            <p style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6, marginTop: 18, maxWidth: '40ch' }}>Ethiopia&apos;s national FC&nbsp;26 league. Twenty clubs. Thirty-eight gameweeks. One champion. Built and broadcast from Addis Ababa.</p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ink-3)', marginBottom: 14 }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href
                      ? <Link href={l.href} style={{ color: 'var(--ink-2)', fontSize: 13.5 }}>{l.label}</Link>
                      : <span style={{ color: 'var(--ink-4)', fontSize: 13.5 }}>{l.label}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, paddingTop: 22, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em', color: 'var(--ink-4)' }}>© 2026 NEXGEN PLC · ADDIS ABABA, ETHIOPIA · ALL RIGHTS RESERVED</div>
          <div style={{ display: 'flex', gap: 18 }}>
            {[{ label: 'TERMS', href: '/terms' }, { label: 'PRIVACY', href: '/privacy' }, { label: 'RULEBOOK', href: '/rulebook' }].map((l) => (
              <Link key={l.label} href={l.href} className="mono" style={{ fontSize: 10.5, letterSpacing: '.18em', color: 'var(--ink-3)' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
      <Css>{`@media (max-width:880px){.footer-grid{grid-template-columns:1fr 1fr!important;gap:32px!important}}@media (max-width:520px){.footer-grid{grid-template-columns:1fr!important}}`}</Css>
    </footer>
  );
}
