import Link from 'next/link';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { PageFooter } from '@/components/SiteNotices';
import { Css } from '@/components/Css';
import { RULEBOOK, RULEBOOK_EDITION, RULEBOOK_STATUS } from '@/data/rulebook';

export const metadata = { title: 'Rulebook · ELECTROCUP 26' };

// The published competition rules. This is a subset of the full rulebook — see
// src/data/rulebook.ts for exactly which sections are held back and why.
export default function RulebookPage() {
  return (
    <>
      <PageHeader />
      <div className="page-wrap" style={{ maxWidth: 860 }}>
        <PageTitle
          file="COMPETITION · RULEBOOK"
          title={<>MATCH<br /><span style={{ color: 'var(--accent-glow)' }}>RULES.</span></>}
          sub={RULEBOOK_EDITION}
        />

        {/* Stated up front rather than in a footnote: a reader has to know this
            is part of the rulebook, not all of it, before they rely on it. */}
        <div className="notice" style={{ marginTop: 24, borderColor: 'rgba(var(--accent-glow-rgb),0.35)', background: 'rgba(var(--accent-rgb),0.05)' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)', marginBottom: 8 }}>
            PUBLISHED IN PART
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)' }}>{RULEBOOK_STATUS}</p>
        </div>

        <nav aria-label="Sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
          {RULEBOOK.map((s) => (
            <a key={s.n} href={`#s${s.n}`} className="mono"
              style={{ padding: '8px 13px', fontSize: 11, letterSpacing: '.12em', border: '1px solid var(--line-2)', background: 'var(--bg-1)', color: 'var(--ink-2)' }}>
              {s.n} · {s.title.toUpperCase()}
            </a>
          ))}
        </nav>

        {RULEBOOK.map((section) => (
          <section key={section.n} id={`s${section.n}`} style={{ marginTop: 48, scrollMarginTop: 90 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>
              SECTION {section.n}
            </div>
            <h2 className="display-2" style={{ fontSize: 28, fontWeight: 800, marginTop: 8, lineHeight: 1.1 }}>
              {section.title.toUpperCase()}
            </h2>
            <p style={{ color: 'var(--ink-3)', fontSize: 13.5, lineHeight: 1.6, margin: '8px 0 0', maxWidth: '60ch' }}>
              {section.blurb}
            </p>

            <div style={{ marginTop: 22, borderTop: '1px solid var(--line)' }}>
              {section.clauses.map((c) => (
                <div key={c.n} style={{ display: 'grid', gridTemplateColumns: '84px 1fr', gap: 18, padding: '18px 0', borderBottom: '1px solid var(--line)' }} className="rule-row">
                  <div className="mono num" style={{ fontSize: 12, letterSpacing: '.08em', color: 'var(--accent-glow)', paddingTop: 2 }}>
                    {c.n}
                  </div>
                  <div>
                    {c.title && (
                      <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.16em', color: 'var(--ink-3)', marginBottom: 6 }}>
                        {c.title.toUpperCase()}
                      </div>
                    )}
                    <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.7 }}>{c.body}</p>
                    {c.bullets && (
                      <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.7 }}>
                        {c.bullets.map((b) => <li key={b} style={{ marginTop: 4 }}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/register" className="btn">REGISTER →</Link>
          <Link href="/" className="btn-ghost">BACK HOME</Link>
        </div>
      </div>
      <PageFooter />
      <Css>{`@media (max-width:560px){.rule-row{grid-template-columns:1fr!important;gap:6px!important}}`}</Css>
    </>
  );
}
