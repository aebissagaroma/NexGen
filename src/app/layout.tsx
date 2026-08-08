import type { Metadata } from 'next';
import './globals.css';

// One description, reused for Open Graph and Twitter so a share card can never
// drift from the page. It names no vehicle make or model — the prize is sealed
// until it is announced on broadcast (src/lib/grand-prize.ts).
const DESCRIPTION =
  "NexGen PLC presents ELECTROCUP 26 — Ethiopia's first national FC league. " +
  '20 clubs. 38 gameweeks. One champion. One electric car.';

export const metadata: Metadata = {
  title: 'ELECTROCUP 26 — NexGen PLC',
  description: DESCRIPTION,
  openGraph: {
    title: 'ELECTROCUP 26',
    description: DESCRIPTION,
    siteName: 'ELECTROCUP 26',
    locale: 'en_ET',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ELECTROCUP 26',
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800;900&family=Saira:wght@500;600;700;800&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
