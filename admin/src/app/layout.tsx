import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ELECTROCUP 26 — Staff',
  // Belt and braces with the X-Robots-Tag header in next.config.mjs.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
