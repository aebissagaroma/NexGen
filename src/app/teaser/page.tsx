'use client';
// Standalone full-viewport teaser, for sharing a link and for capture.
//
// No nav, no footer, nothing but the frame — anything else in shot defeats the
// point of a page whose whole job is to be the teaser.
import * as React from 'react';
import Link from 'next/link';
import { Teaser } from '@/components/teaser/Teaser';

export default function TeaserPage() {
  return (
    <main style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '100vw', height: '100dvh' }}>
        <Teaser fit="contain" standalone />
      </div>
      <Link
        href="/"
        className="mono"
        style={{ position: 'fixed', left: 18, bottom: 18, zIndex: 12, fontSize: 10.5, letterSpacing: '.18em', textTransform: 'uppercase', color: '#E8E8EA', background: 'rgba(10,10,11,.72)', border: '1px solid rgba(255,255,255,.18)', padding: '9px 14px' }}
      >
        ← ELECTROCUP 26
      </Link>
    </main>
  );
}
