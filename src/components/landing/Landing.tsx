'use client';
// Landing root — wires the palette theme system + all sections + tweaks panel.
// Ported from app.jsx (the ACCENT_PALETTES / CSS-var application logic is intact).
import * as React from 'react';
import { Nav, Hero } from './Hero';
import { TeaserSection } from '@/components/teaser/TeaserSection';
import { FormatSection } from './Format';
import { ClubsSection } from './Clubs';
import { BracketSection } from './Bracket';
import { PrizeSection } from './Prize';
import { ScheduleSection, SponsorsSection, AboutSection, RegisterCTA, Footer } from './Closing';
import { useReveal } from './primitives';
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakSelect, TweakToggle } from './TweaksPanel';

const TWEAK_DEFAULTS = {
  accent: 'obsidian', scanlines: 'subtle', netTexture: 'subtle', ps5Mood: true,
};

const ACCENT_PALETTES: Record<string, any> = {
  obsidian: { label: 'OBSIDIAN', desc: 'Brand · satin gold on matte black', accent: '#C79A3A', glow: '#F2DD9C', deep: '#7E5A12', ink: '#120E05', accent2: '#B8912F', accent3: '#E7CE86', bg: '#060607', bg1: '#0C0B0A', bg2: '#131110', bg3: '#1B1815', swatch: ['#C79A3A', '#060607', '#F2DD9C'] },
  electric: { label: 'ELECTRIC', desc: 'Cool tech blue', accent: '#3B6BFF', glow: '#5C8AFF', deep: '#1E3FB8', ink: '#EAF1FF', accent2: '#FF5A3C', accent3: '#6FE7C5', bg: '#05070C', bg1: '#090C14', bg2: '#0E121C', bg3: '#141927', swatch: ['#3B6BFF', '#05070C', '#EAF1FF'] },
  highland: { label: 'HIGHLAND', desc: 'Ethiopian tricolor · gold-led', accent: '#F5C443', glow: '#FFD86B', deep: '#B58820', ink: '#1A1208', accent2: '#D03A2A', accent3: '#1F8A5B', bg: '#0A0805', bg1: '#0F0C08', bg2: '#15110B', bg3: '#1D1810', swatch: ['#F5C443', '#D03A2A', '#1F8A5B', '#0A0805'] },
  floodlight: { label: 'FLOODLIGHT', desc: 'Stadium night · sodium amber', accent: '#FF8C2A', glow: '#FFAE5C', deep: '#A04F0F', ink: '#FFE9D2', accent2: '#FF3B5C', accent3: '#39D69E', bg: '#04060B', bg1: '#070A12', bg2: '#0C111C', bg3: '#121826', swatch: ['#FF8C2A', '#04060B', '#FFE9D2'] },
  plasma: { label: 'PLASMA', desc: 'Pure black · cyan plasma', accent: '#00C2FF', glow: '#5BE0FF', deep: '#006B8C', ink: '#DCF6FF', accent2: '#FF2EA0', accent3: '#9DFF38', bg: '#000000', bg1: '#050505', bg2: '#0A0A0A', bg3: '#101010', swatch: ['#00C2FF', '#000000', '#FFFFFF'] },
  copper: { label: 'COPPER', desc: 'Coffee earth · warm copper', accent: '#C97E3F', glow: '#E8A05C', deep: '#6F4015', ink: '#F4E4C9', accent2: '#9C2A1A', accent3: '#5C7A3A', bg: '#0E0905', bg1: '#140C07', bg2: '#1B110A', bg3: '#23170E', swatch: ['#C97E3F', '#0E0905', '#F4E4C9'] },
};

const hex2rgb = (h: string) => {
  const x = h.replace('#', '');
  const n = parseInt(x.length === 3 ? x.split('').map((c) => c + c).join('') : x, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

export default function Landing() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useReveal();

  React.useEffect(() => {
    const p = ACCENT_PALETTES[t.accent] || ACCENT_PALETTES.obsidian;
    const root = document.documentElement;
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--accent-glow', p.glow);
    root.style.setProperty('--accent-deep', p.deep);
    root.style.setProperty('--accent-ink', p.ink);
    root.style.setProperty('--accent-rgb', hex2rgb(p.accent));
    root.style.setProperty('--accent-glow-rgb', hex2rgb(p.glow));
    root.style.setProperty('--accent-deep-rgb', hex2rgb(p.deep));
    root.style.setProperty('--accent-2', p.accent2);
    root.style.setProperty('--accent-3', p.accent3);
    root.style.setProperty('--accent-2-rgb', hex2rgb(p.accent2));
    root.style.setProperty('--accent-3-rgb', hex2rgb(p.accent3));
    root.style.setProperty('--bg', p.bg);
    root.style.setProperty('--bg-1', p.bg1);
    root.style.setProperty('--bg-2', p.bg2);
    root.style.setProperty('--bg-3', p.bg3);
  }, [t.accent]);

  React.useEffect(() => {
    const root = document.documentElement;
    const SCAN: Record<string, number> = { off: 0, subtle: 0.10, strong: 0.22 };
    const NET: Record<string, number> = { off: 0, subtle: 0.08, medium: 0.16, bold: 0.28 };
    root.style.setProperty('--scan-opacity', String(SCAN[t.scanlines] ?? 0.10));
    root.style.setProperty('--net-opacity', String(NET[t.netTexture] ?? 0.08));
  }, [t.scanlines, t.netTexture]);

  return (
    <>
      <Nav />
      <Hero />
      <TeaserSection />
      <FormatSection ps5Mood={t.ps5Mood} />
      <ClubsSection />
      <BracketSection />
      <PrizeSection />
      <ScheduleSection />
      <SponsorsSection />
      <AboutSection />
      <RegisterCTA />
      <Footer />

      <TweaksPanel>
        <TweakSection label="Brand palette" />
        <TweakColor label="Direction" value={ACCENT_PALETTES[t.accent]?.swatch || ACCENT_PALETTES.obsidian.swatch}
          options={Object.values(ACCENT_PALETTES).map((p: any) => p.swatch)}
          onChange={(arr: any) => {
            const key = Object.keys(ACCENT_PALETTES).find((k) => JSON.stringify(ACCENT_PALETTES[k].swatch) === JSON.stringify(arr)) || 'obsidian';
            setTweak('accent', key);
          }} />
        <TweakSection label="Texture & atmosphere" />
        <TweakSelect label="Scanlines" value={t.scanlines} options={[{ value: 'off', label: 'Off' }, { value: 'subtle', label: 'Subtle' }, { value: 'strong', label: 'Strong' }]} onChange={(v: string) => setTweak('scanlines', v)} />
        <TweakSelect label="Net texture" value={t.netTexture} options={[{ value: 'off', label: 'Off' }, { value: 'subtle', label: 'Subtle' }, { value: 'medium', label: 'Medium' }, { value: 'bold', label: 'Bold' }]} onChange={(v: string) => setTweak('netTexture', v)} />
        <TweakToggle label="PS5 mood plate" value={t.ps5Mood} onChange={(v: boolean) => setTweak('ps5Mood', v)} />
      </TweaksPanel>
    </>
  );
}
