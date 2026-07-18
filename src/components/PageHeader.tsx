'use client';
import * as React from 'react';
import Link from 'next/link';
import { NexGenMark } from './landing/primitives';

// Slim fixed header for interior pages (register, bracket, standings, etc.).
export function PageHeader({ right }: { right?: React.ReactNode }) {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 'var(--rail-h)', background: 'rgba(5,7,12,0.82)', backdropFilter: 'blur(14px) saturate(150%)', WebkitBackdropFilter: 'blur(14px) saturate(150%)', borderBottom: '1px solid var(--line)' }}>
      <div className="wrap" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NexGenMark size={44} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: '.24em', color: 'var(--ink-3)' }}>NEXGEN PLC</span>
            <span style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 14, letterSpacing: '.02em', color: 'var(--ink)', marginTop: 2 }}>ELECTROCUP <span style={{ color: 'var(--accent-glow)' }}>26</span></span>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Link href="/bracket" className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-2)' }}>BRACKETS</Link>
          <Link href="/standings" className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-2)' }}>TABLE</Link>
          {right}
        </div>
      </div>
    </nav>
  );
}

export function PageTitle({ file, title, sub }: { file: string; title: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div className="marker">{file}</div>
      <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 76px)', margin: '14px 0 0', lineHeight: 0.95 }}>{title}</h1>
      {sub && <p style={{ color: 'var(--ink-3)', fontSize: 15, lineHeight: 1.55, maxWidth: '56ch', marginTop: 14 }}>{sub}</p>}
    </div>
  );
}
