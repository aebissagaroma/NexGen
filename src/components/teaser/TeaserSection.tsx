'use client';
// The teaser as a homepage section, directly under the hero.
//
// Full-bleed: the stage breaks out of .wrap so the 16:9 frame runs edge to edge,
// with only the FILE/00 label kept inside the normal column so it lines up with
// every other section marker on the page.
import * as React from 'react';
import { Teaser } from './Teaser';

export function TeaserSection() {
  return (
    <section id="teaser" style={{ background: 'var(--bg)', paddingTop: 'clamp(40px,5vw,72px)', paddingBottom: 'clamp(40px,5vw,72px)' }}>
      <div className="wrap" style={{ marginBottom: 22 }}>
        <div className="marker">FILE/00 · TEASER</div>
      </div>
      <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <Teaser fit="width" />
      </div>
    </section>
  );
}
