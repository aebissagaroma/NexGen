// Rights and attribution notices, required on every page.
//
// These are licence and trademark statements, not decoration: they have to be
// present wherever a visitor lands, including the register, bracket, standings
// and legal pages — not only the home page. Kept in one component so the wording
// cannot drift between pages.
//
// EA_NOTICE_PLACEHOLDER is left exactly as written, to be replaced with the
// publisher's required wording verbatim. It renders as-is rather than being
// hidden, so an unreplaced marker is impossible to miss in review.
export const EA_NOTICE = 'EA_NOTICE_PLACEHOLDER';

export const NOTICES = [
  EA_NOTICE,
  'ELECTROCUP 26 is not affiliated with, endorsed by, or licensed by the Premier League or any club named on this site.',
  'Played on EA SPORTS FC 26.',
];

export function SiteNotices({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="mono"
      style={{
        display: 'grid', gap: 4, fontSize: 10, lineHeight: 1.6,
        letterSpacing: '.06em', color: 'var(--ink-4)', maxWidth: '92ch',
        ...style,
      }}
    >
      {NOTICES.map((n) => <span key={n}>{n}</span>)}
    </div>
  );
}

/**
 * Footer for the pages that are not the landing page. Those render a bare
 * PageHeader and had no footer at all, so without this the notices would appear
 * on the home page only.
 */
export function PageFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', marginTop: 64, padding: '28px 0 40px' }}>
      <div className="page-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <SiteNotices />
        <div className="mono" style={{ marginTop: 16, fontSize: 10.5, letterSpacing: '.14em', color: 'var(--ink-4)' }}>
          © 2026 NEXGEN PLC · ADDIS ABABA, ETHIOPIA · ALL RIGHTS RESERVED
        </div>
      </div>
    </footer>
  );
}
