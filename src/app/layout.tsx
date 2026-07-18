import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ELECTROCUP 26 — NexGen PLC',
  description: "NexGen PLC presents ELECTROCUP 26 — Ethiopia's first national FC 26 Premier League. 20 clubs. 38 gameweeks. One champion. One car.",
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
