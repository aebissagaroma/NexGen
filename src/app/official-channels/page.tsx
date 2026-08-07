import Link from 'next/link';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { PageFooter } from '@/components/SiteNotices';
import {
  OFFICIAL_DOMAIN, OFFICIAL_EMAIL_SUFFIX, SOCIAL_CHANNELS, REPORT_EMAIL, NEVER_CONTACT,
} from '@/data/official-channels';

export const metadata = { title: 'Official channels · ELECTROCUP 26' };

// Styled to match /privacy and /rulebook so the three read as one set.
export default function OfficialChannelsPage() {
  return (
    <>
      <PageHeader />
      <div className="page-wrap" style={{ maxWidth: 860 }}>
        <PageTitle
          file="TRUST · CHANNELS"
          title={<>OFFICIAL<br /><span style={{ color: 'var(--accent-glow)' }}>CHANNELS.</span></>}
          sub="The only accounts and addresses we operate."
        />

        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.7, marginTop: 22, maxWidth: '70ch' }}>
          These are the only accounts and addresses operated by NexGen PLC for ELECTROCUP 26.
          Anything else claiming to represent the competition is not ours.
        </p>

        <Row title="WEBSITE">
          <p style={base}>{OFFICIAL_DOMAIN}</p>
        </Row>

        <Row title="REGISTRATION">
          <p style={base}>Registration happens only at {OFFICIAL_DOMAIN}. Nowhere else.</p>
        </Row>

        <Row title="SOCIAL">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
            {SOCIAL_CHANNELS.map((c) => (
              <li key={c.platform} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.18em', color: 'var(--ink-4)', minWidth: 92 }}>
                  {c.platform.toUpperCase()}
                </span>
                <a href={c.href} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent-glow)', fontSize: 14.5 }}>
                  {c.handle}
                </a>
              </li>
            ))}
          </ul>
        </Row>

        <Row title="EMAIL">
          <p style={base}>We only ever contact you from addresses ending {OFFICIAL_EMAIL_SUFFIX}</p>
        </Row>

        <Row title="HOW WE WILL NEVER CONTACT YOU">
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.75, maxWidth: '70ch' }}>
            {NEVER_CONTACT.map((n) => <li key={n} style={{ marginTop: 6 }}>{n}</li>)}
          </ul>
          <p style={{ ...base, marginTop: 16 }}>
            The qualifier session fee is paid in advance of your session through official channels only.
            Nothing is ever collected by direct message.
          </p>
        </Row>

        <Row title="SEEN SOMETHING SUSPICIOUS?">
          {REPORT_EMAIL ? (
            <p style={base}>
              Report it to{' '}
              <a href={`mailto:${REPORT_EMAIL}`} style={{ color: 'var(--accent-glow)' }}>{REPORT_EMAIL}</a>{' '}
              with a screenshot and the link. We will confirm within two working days whether it is ours.
            </p>
          ) : (
            /* No address is printed until a real one is configured. A made-up
               contact on this page would swallow exactly the reports it asks
               for. See REPORT_EMAIL in src/data/official-channels.ts. */
            <p style={base}>
              Send a screenshot and the link to any of the accounts listed above and we will confirm
              within two working days whether it is ours. A dedicated reporting address is being
              published shortly.
            </p>
          )}
        </Row>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
          <p className="mono" style={{ fontSize: 11, letterSpacing: '.06em', color: 'var(--ink-3)', lineHeight: 1.7, maxWidth: '70ch', margin: 0 }}>
            ELECTROCUP is a registered trade mark of NexGen PLC in Ethiopia. Unauthorised use of the
            name or marks is an infringement and will be reported to the relevant platform and pursued.
          </p>
        </div>

        <div style={{ marginTop: 44, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/privacy" className="btn-ghost">PRIVACY NOTICE</Link>
          <Link href="/rulebook" className="btn-ghost">COMPETITION RULES</Link>
          <Link href="/" className="btn-ghost">BACK HOME</Link>
        </div>
      </div>
      <PageFooter />
    </>
  );
}

const base: React.CSSProperties = {
  color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.75, maxWidth: '70ch', margin: 0,
};

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
      <h2 className="display-2" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.15, marginBottom: 14 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
