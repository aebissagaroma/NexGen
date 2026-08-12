'use client';
// Last-resort error boundary for the whole App Router tree. Reports the crash,
// then shows a minimal branded fallback — this renders in place of the root
// layout, so it must carry its own <html>/<body> and inline styling.
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#060607', color: '#EDEDEF', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.22em', color: '#C8A24E', marginBottom: 16 }}>ELECTROCUP 26</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>Something went wrong.</h1>
          <p style={{ fontSize: 13, color: '#9A9AA2', maxWidth: '38ch', lineHeight: 1.6, margin: '0 auto 22px' }}>
            The error has been reported. Your registration and entry are not affected.
          </p>
          <button
            onClick={reset}
            style={{ background: '#C8A24E', color: '#060607', border: 0, padding: '12px 22px', fontSize: 12, letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            TRY AGAIN →
          </button>
        </div>
      </body>
    </html>
  );
}
