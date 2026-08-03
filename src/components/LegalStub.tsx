import Link from 'next/link';
import { PageHeader, PageTitle } from '@/components/PageHeader';

// Shared shell for the legal/reference pages that are not written yet.
//
// These exist so the footer has somewhere real to point: a link to "#" tells a
// visitor nothing, and a 404 on Terms or Privacy reads badly on a site that
// collects names, emails and ID documents. The page states plainly that the
// document is not published yet and offers a way to ask.
export function LegalStub({ file, title, blurb }: { file: string; title: string; blurb: string }) {
  return (
    <>
      <PageHeader />
      <div className="page-wrap" style={{ maxWidth: 720 }}>
        <PageTitle file={file} title={title} sub={blurb} />
        <div className="form-card" style={{ marginTop: 28 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.22em', color: 'var(--accent-glow)' }}>
            COMING SOON
          </div>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.65, marginTop: 14 }}>
            This document is being finalised and will be published here before qualifier
            registration opens. Until then, questions can go to the NexGen team and we will
            answer them directly.
          </p>
          <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/" className="btn-ghost">BACK HOME</Link>
          </div>
        </div>
      </div>
    </>
  );
}
