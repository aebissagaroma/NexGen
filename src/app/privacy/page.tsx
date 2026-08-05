import Link from 'next/link';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { PageFooter } from '@/components/SiteNotices';
import { Css } from '@/components/Css';
import { PRIVACY, PRIVACY_INTRO, PRIVACY_INCOMPLETE, PRIVACY_UPDATED } from '@/data/privacy';

export const metadata = { title: 'Privacy · ELECTROCUP 26' };

// Styled to match /rulebook so the two legal pages read as one set.
export default function PrivacyPage() {
  return (
    <>
      <PageHeader />
      <div className="page-wrap" style={{ maxWidth: 860 }}>
        <PageTitle
          file="LEGAL · PRIVACY"
          title={<>PRIVACY<br /><span style={{ color: 'var(--accent-glow)' }}>NOTICE.</span></>}
          sub={`Last updated ${PRIVACY_UPDATED}`}
        />

        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.7, marginTop: 22, maxWidth: '70ch' }}>
          {PRIVACY_INTRO}
        </p>

        {/* Same treatment as the rulebook's "published in part" panel: a reader
            must know which parts are still open before relying on it. */}
        <div className="notice" style={{ marginTop: 22, borderColor: 'rgba(var(--accent-glow-rgb),0.35)', background: 'rgba(var(--accent-rgb),0.05)' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--accent-glow)', marginBottom: 8 }}>
            PUBLISHED IN PART
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)' }}>{PRIVACY_INCOMPLETE}</p>
        </div>

        <nav aria-label="Sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
          {PRIVACY.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="mono"
              style={{ padding: '8px 13px', fontSize: 11, letterSpacing: '.12em', border: '1px solid var(--line-2)', background: 'var(--bg-1)', color: 'var(--ink-2)' }}>
              {s.title.toUpperCase()}
            </a>
          ))}
        </nav>

        {PRIVACY.map((section) => (
          <section key={section.id} id={section.id} style={{ marginTop: 40, scrollMarginTop: 90, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
            <h2 className="display-2" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>
              {section.title.toUpperCase()}
            </h2>
            {section.body.map((para) => (
              <p key={para.slice(0, 40)} style={{ color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.75, marginTop: 14, maxWidth: '70ch' }}>
                {para}
              </p>
            ))}
            {section.bullets && (
              <ul style={{ margin: '14px 0 0', paddingLeft: 20, color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.75, maxWidth: '70ch' }}>
                {section.bullets.map((b) => <li key={b} style={{ marginTop: 6 }}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        <div style={{ marginTop: 44, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/rulebook" className="btn-ghost">COMPETITION RULES</Link>
          <Link href="/" className="btn-ghost">BACK HOME</Link>
        </div>
      </div>
      <PageFooter />
      <Css>{`@media (max-width:560px){.page-wrap ul{padding-left:18px!important}}`}</Css>
    </>
  );
}
