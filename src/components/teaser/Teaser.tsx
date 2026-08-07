'use client';
// ELECTROCUP 26 — 30-second teaser, ported from design/electrocup-teaser-v5.html.
//
// That file stays as the capture source and is never edited to suit this port.
// This component is the live version of it: same 30s timeline, same palette,
// same beats, same effects, with the HUD removed and three things made real —
// the end card reads the registration state from static.ts, the slot-claim beat
// reads club codes from the club data, and playback is driven by visibility
// rather than a Play button.
//
// EVERYTHING IS SCOPED under .ec-teaser. The capture uses names like .grid,
// .beat, .cell and .slot, which already mean other things in globals.css, so an
// unscoped port would quietly restyle the rest of the site.
//
// The prize is sealed. Nothing here names a make or a model, and nothing should
// ever be added that does. The stars, constellation and comet are the night-sky
// motif and are load-bearing design, not decoration to trim for performance —
// the reduced and lite modes below keep them and drop other things instead.
import * as React from 'react';
import Link from 'next/link';
import { Css } from '@/components/Css';
import {
  CLUBS_A, CLUBS_B, REGISTRATION_OPENS, REGISTRATION_OPENS_TIME,
} from '@/data/static';

const DURATION = 30000;

/** Group A codes first, then Group B — never a second hard-coded list. */
const CLUB_CODES = [...CLUBS_A, ...CLUBS_B].map((c) => c.code);

const CELLS = 64;

const ROWS = [
  { code: 'ARS', name: 'Arsenal', pos: [0, 2, 3], pts: [38, 61, 79] },
  { code: 'MCI', name: 'Man City', pos: [1, 0, 1], pts: [37, 64, 84] },
  { code: 'LIV', name: 'Liverpool', pos: [2, 1, 0], pts: [36, 63, 88] },
  { code: 'SUN', name: 'Sunderland', pos: [3, 4, 2], pts: [34, 58, 81] },
  { code: 'CHE', name: 'Chelsea', pos: [4, 3, 4], pts: [33, 59, 76] },
  { code: 'AVL', name: 'Aston Villa', pos: [5, 5, 5], pts: [31, 55, 72] },
];

// Ambient twinkle field. Sixteen stars, fixed positions — random ones would
// differ between server and client render and blank the page on hydration.
const STARS = [
  [31, 87, 2.7, 2.4], [13, 19, 4.2, 3.1], [11, 96, 4.0, 2.0], [87, 57, 4.7, 3.9],
  [58, 94, 4.4, 3.1], [9, 88, 4.6, 0.9], [22, 30, 3.8, 3.4], [55, 49, 2.8, 2.3],
  [9, 97, 3.0, 2.2], [21, 68, 2.3, 0.0], [82, 87, 3.7, 3.3], [91, 57, 3.3, 2.8],
  [13, 35, 2.7, 2.5], [60, 80, 3.5, 0.2], [15, 19, 3.6, 2.9], [11, 9, 3.3, 1.5],
];

const CAR_PATH = 'M78 286 C84 258 94 236 116 226 C136 214 170 206 206 204 C246 200 270 202 288 204 C306 166 352 146 414 140 C470 136 522 140 560 154 C600 170 630 196 662 208 C700 212 724 220 740 236 C754 252 762 268 772 278 C792 282 806 284 822 286';
const CAR_CLOSED = `${CAR_PATH} C800 293 758 297 718 297 C660 301 540 303 450 303 C360 303 280 300 244 296 C220 294 200 293 170 292 C130 291 96 289 78 286 Z`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

type Fit = 'width' | 'contain';

export function Teaser({ fit = 'width', standalone = false }: { fit?: Fit; standalone?: boolean }) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const fxRef = React.useRef<HTMLCanvasElement | null>(null);
  const embersRef = React.useRef<HTMLCanvasElement | null>(null);

  // Lazy mount: nothing heavy exists until the section is near the viewport.
  const [mounted, setMounted] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const [lite, setLite] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Elapsed time survives a pause, so leaving and returning resumes rather than
  // restarting — the teaser plays ONCE and then rests on the end card.
  const elapsed = React.useRef(0);
  const startedAt = React.useRef(0);
  const raf = React.useRef(0);
  const playedOnce = React.useRef(false);

  React.useEffect(() => {
    setOpen(Date.now() >= REGISTRATION_OPENS);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);

    // Lite mode: small viewports and low-memory devices keep the flashes, the
    // colour washes and the constellation, and lose the grain animation and
    // both particle canvases — the expensive per-frame work, not the motif.
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    setLite(window.innerWidth < 768 || (typeof mem === 'number' && mem <= 4));
    return () => mq.removeEventListener('change', apply);
  }, []);

  const noCanvas = reduced || lite;

  /* ---- scaling: the stage is authored at 1920x1080 and scaled to fit ---- */
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const resize = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const w = host.clientWidth;
      const h = fit === 'contain' ? host.clientHeight : (w * 1080) / 1920;
      const sc = fit === 'contain' ? Math.min(w / 1920, h / 1080) : w / 1920;
      stage.style.transform = `scale(${sc})`;
      host.style.height = `${1080 * sc}px`;
      if (fit === 'contain') {
        stage.style.left = `${(w - 1920 * sc) / 2}px`;
        stage.style.top = `${(h - 1080 * sc) / 2}px`;
        host.style.height = '';
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // capped at 2
      for (const c of [fxRef.current, embersRef.current]) {
        if (!c) continue;
        c.width = Math.round(c.offsetWidth * dpr);
        c.height = Math.round(c.offsetHeight * dpr);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    window.addEventListener('resize', resize);
    return () => { ro.disconnect(); window.removeEventListener('resize', resize); };
  }, [fit, mounted]);

  /* ---- visibility: mount near the viewport, play at 60% ---- */
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setMounted(true);
        // Plays once. After that, returning to it does not restart it — the
        // end card is where it rests, and REPLAY is the only way back.
        if (e.intersectionRatio >= 0.6 && !playedOnce.current) {
          playedOnce.current = true;
          setPlaying(true);
        } else if (!e.isIntersecting) {
          setPlaying(false);
        }
      }
    }, { threshold: [0, 0.6], rootMargin: '200px' });
    io.observe(host);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    const onVis = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  /* ---- the clock ---- */
  React.useEffect(() => {
    if (!playing || !mounted) { cancelAnimationFrame(raf.current); return; }
    startedAt.current = performance.now() - elapsed.current;
    const stage = stageRef.current;
    if (stage) stage.classList.add('playing');

    const fx = fxRef.current;
    const em = embersRef.current;
    const fctx = noCanvas ? null : fx?.getContext('2d') ?? null;
    const ectx = noCanvas ? null : em?.getContext('2d') ?? null;

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; decay: number; c: string };
    let bursts: P[] = [];
    let rings: { x: number; y: number; r: number; a: number }[] = [];
    let embersP: { x: number; y: number; vx: number; vy: number; r: number; a: number; decay: number; ph: number }[] = [];
    const fired: Record<string, 1> = {};

    const burst = (x: number, y: number, c: string, n: number) => {
      if (!fctx) return;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * 6.283; const sp = 2 + Math.random() * 6.5;
        bursts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 1 + Math.random() * 2.6, a: 0.9, decay: 0.016 + Math.random() * 0.02, c });
      }
      rings.push({ x, y, r: 8, a: 0.75 });
    };
    const fire = (k: string, fn: () => void) => { if (!fired[k]) { fired[k] = 1; fn(); } };

    const q = (sel: string) => stage?.querySelector(sel) as HTMLElement | null;
    const qa = (sel: string) => Array.from(stage?.querySelectorAll(sel) ?? []) as HTMLElement[];

    const cells = qa('.tz-cell');
    const slotEls = qa('.tz-slot');
    const rowEls = qa('.tz-trow');
    const s1 = q('#tz-s1'); const s2 = q('#tz-s2');
    const f1 = q('#tz-f1'); const f2 = q('#tz-f2');
    const g1 = qa('#tz-g1 > i'); const g2 = qa('#tz-g2 > i');
    const adv1 = q('#tz-adv1');
    const tintEl = q('.tz-tint'); const pulseEl = q('.tz-pulse'); const flashEl = q('.tz-flash');
    const tableEl = q('.tz-table');

    // Deterministic shuffle — the capture's LCG, so the cascade dies in the
    // same order every time and matches the reference recording.
    const order = [...Array(CELLS).keys()];
    let sd = 7;
    for (let i = order.length - 1; i > 0; i--) { sd = (sd * 16807) % 2147483647; const j = sd % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }

    let rowH = 0;
    const measure = () => {
      if (!rowEls.length || !tableEl) return;
      rowH = rowEls[0].offsetHeight + tableEl.clientWidth * 0.012;
      tableEl.style.height = `${rowH * ROWS.length}px`;
    };
    measure();

    const frameAt = (t: number) => {
      /* duel — game wins at 6.0, 7.2, 8.4; advance stamp at 8.8 */
      const a = t >= 6.0 ? 1 : 0, b = t >= 7.2 ? 1 : 0, c = t >= 8.4 ? 1 : 0;
      if (s1) s1.textContent = String(a + c);
      if (s2) s2.textContent = String(b);
      if (g1[0]) g1[0].className = 'tz-gl' + (t >= 6.0 ? ' won' : '');
      if (g2[0]) g2[0].className = 'tz-gl' + (t >= 6.0 ? ' lost' : '');
      if (g1[1]) g1[1].className = 'tz-gl' + (t >= 7.2 ? ' lost' : '');
      if (g2[1]) g2[1].className = 'tz-gl' + (t >= 7.2 ? ' won' : '');
      if (g1[2]) g1[2].className = 'tz-gl' + (t >= 8.4 ? ' won' : '');
      if (g2[2]) g2[2].className = 'tz-gl' + (t >= 8.4 ? ' lost' : '');
      if (f1) f1.className = 'tz-fighter' + ((a + c) > b ? ' lead' : '');
      if (f2) f2.className = 'tz-fighter p2' + (t >= 8.8 ? ' out' : (b > (a + c) ? ' lead' : ''));
      if (adv1) adv1.className = 'tz-adv' + (t >= 8.8 ? ' on' : '');

      /* cascade 10.0 → 13.4 */
      const p3 = clamp01((t - 10.0) / 3.4);
      const dead = Math.floor(Math.pow(p3, 1.7) * (CELLS - 1));
      cells.forEach((cl) => { cl.className = 'tz-cell alive'; });
      for (let k = 0; k < dead; k++) cells[order[k]] && (cells[order[k]].className = 'tz-cell out');
      if (dead > 0 && dead < CELLS && cells[order[dead]]) cells[order[dead]].className = 'tz-cell hot';
      if (p3 >= 1) cells.forEach((cl, i) => { cl.className = i === order[CELLS - 1] ? 'tz-cell champ' : 'tz-cell out'; });

      /* slot claim 14.3 → 16.9 */
      const p4 = clamp01((t - 14.3) / 2.6);
      const claimed = Math.floor(p4 * 20);
      slotEls.forEach((sEl, i) => {
        const code = sEl.dataset.code || '';
        const k1 = sEl.children[0] as HTMLElement; const k2 = sEl.children[1] as HTMLElement;
        if (i < claimed) { sEl.className = 'tz-slot claimed'; k1.textContent = code; k2.textContent = 'claimed'; }
        else if (i === claimed && p4 > 0) { sEl.className = 'tz-slot flash'; k1.textContent = code; k2.textContent = 'won'; }
        else { sEl.className = 'tz-slot'; k1.textContent = '—'; k2.textContent = 'open'; }
      });

      /* league table race 18.2 → 21.9 */
      const p5 = clamp01((t - 18.2) / 3.7);
      const seg = p5 < 0.5 ? 0 : 1; const local = p5 < 0.5 ? p5 / 0.5 : (p5 - 0.5) / 0.5;
      const ease = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
      const orderNow: { i: number; y: number }[] = [];
      ROWS.forEach((r, i) => {
        const el = rowEls[i]; if (!el) return;
        const y = lerp(r.pos[seg], r.pos[seg + 1], ease);
        el.style.transform = `translateY(${y * rowH}px)`;
        const pts = el.querySelector('.tz-pts'); if (pts) pts.textContent = String(Math.round(lerp(r.pts[seg], r.pts[seg + 1], ease)));
        orderNow.push({ i, y });
      });
      orderNow.sort((x, y) => x.y - y.y).forEach((o, rank) => {
        const el = rowEls[o.i]; if (!el) return;
        const pos = el.querySelector('.tz-pos'); if (pos) pos.textContent = String(rank + 1).padStart(2, '0');
        el.classList.toggle('lead', rank === 0 && p5 > 0.15);
      });

      /* counters */
      qa('.tz-num').forEach((el) => {
        const st = +(el.dataset.start || 0); const en = +(el.dataset.end || 1);
        const p = clamp01((t - st) / (en - st));
        el.textContent = String(Math.round(lerp(+(el.dataset.from || 0), +(el.dataset.to || 0), p))).padStart(2, '0');
      });

      /* star-glint embers over the prize beat */
      if (ectx && em && t > 22.4 && t < 27.0) {
        if (embersP.length < 90 && Math.random() < 0.5) {
          embersP.push({ x: Math.random() * em.width, y: em.height * (0.75 + Math.random() * 0.25), vy: -(0.4 + Math.random() * 1.1), vx: (Math.random() - 0.5) * 0.4, r: 0.8 + Math.random() * 2.2, a: 0.15 + Math.random() * 0.5, decay: 0.002 + Math.random() * 0.004, ph: Math.random() * 6.283 });
        }
        ectx.clearRect(0, 0, em.width, em.height);
        embersP = embersP.filter((p) => p.a > 0);
        for (const p of embersP) {
          p.x += p.vx; p.y += p.vy; p.a -= p.decay;
          const tw = Math.max(p.a, 0) * (0.55 + 0.45 * Math.sin(t * 6 + p.ph));
          ectx.beginPath(); ectx.arc(p.x, p.y, p.r, 0, 7);
          ectx.fillStyle = `rgba(240,222,160,${tw})`; ectx.fill();
          if (p.r > 1.7) {
            ectx.strokeStyle = `rgba(255,246,220,${tw * 0.7})`; ectx.lineWidth = 1;
            ectx.beginPath(); ectx.moveTo(p.x - p.r * 3.2, p.y); ectx.lineTo(p.x + p.r * 3.2, p.y);
            ectx.moveTo(p.x, p.y - p.r * 3.2); ectx.lineTo(p.x, p.y + p.r * 3.2); ectx.stroke();
          }
        }
      } else if (ectx && em && embersP.length) { embersP = []; ectx.clearRect(0, 0, em.width, em.height); }

      /* flash frames on the hits — kept even in lite mode */
      let fl = 0;
      for (const [ht, amp, dur] of [[6.0, 0.85, 0.28], [7.2, 0.85, 0.28], [8.4, 1, 0.3], [23.1, 1, 0.5]] as const) {
        const d = t - ht; if (d >= 0 && d < dur) fl = Math.max(fl, amp * (1 - d / dur));
      }
      if (flashEl) flashEl.style.opacity = String(fl * 0.8);

      /* bursts, flashes and shockwave rings on the duel hits and the impact */
      if (fctx && fx) {
        if (t >= 6.0) fire('h1', () => burst(fx.width * 0.32, fx.height * 0.5, '240,220,164', 30));
        if (t >= 7.2) fire('h2', () => burst(fx.width * 0.68, fx.height * 0.5, '127,212,255', 30));
        if (t >= 8.4) fire('h3', () => burst(fx.width * 0.32, fx.height * 0.5, '240,220,164', 54));
        if (t >= 23.1) fire('h4', () => {
          burst(fx.width * 0.5, fx.height * 0.45, '240,220,164', 96);
          burst(fx.width * 0.5, fx.height * 0.45, '255,255,255', 40);
          rings.push({ x: fx.width * 0.5, y: fx.height * 0.45, r: 40, a: 0.6 });
        });
        fctx.clearRect(0, 0, fx.width, fx.height);
        bursts = bursts.filter((p) => p.a > 0);
        for (const p of bursts) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.a -= p.decay;
          fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 7);
          fctx.fillStyle = `rgba(${p.c},${Math.max(p.a, 0)})`; fctx.fill();
        }
        rings = rings.filter((r) => r.a > 0);
        for (const rg of rings) {
          rg.r += fx.width * 0.014; rg.a -= 0.05;
          fctx.beginPath(); fctx.arc(rg.x, rg.y, rg.r, 0, 7);
          fctx.strokeStyle = `rgba(240,220,164,${Math.max(rg.a, 0)})`; fctx.lineWidth = 3; fctx.stroke();
        }
      }

      /* accelerating red pressure pulse */
      let po = 0;
      if (t > 10 && t < 13.6) { const u = t - 10; po = 0.30 * (0.5 + 0.5 * Math.sin(6.283 * (0.9 * u + 0.30 * u * u))); }
      if (t > 21.3 && t < 23.1) { const u = t - 21.3; po = Math.max(po, 0.42 * (0.5 + 0.5 * Math.sin(6.283 * (1.5 * u + 1.0 * u * u)))); }
      if (pulseEl) pulseEl.style.opacity = String(reduced ? 0 : po);

      /* per-beat colour wash */
      let bg = 'transparent';
      if (t >= 1.9 && t < 4.7) bg = 'radial-gradient(60% 60% at 50% 40%,rgba(200,162,78,.10),transparent)';
      else if (t >= 4.9 && t < 9.6) bg = 'linear-gradient(90deg,rgba(200,162,78,.15),transparent 42%,transparent 58%,rgba(78,200,255,.17))';
      else if (t >= 9.8 && t < 13.7) bg = 'radial-gradient(70% 60% at 50% 50%,rgba(232,82,78,.11),transparent)';
      else if (t >= 13.9 && t < 17.7) bg = 'radial-gradient(70% 60% at 50% 50%,rgba(200,162,78,.13),transparent)';
      else if (t >= 17.9 && t < 22.2) bg = 'linear-gradient(180deg,rgba(78,200,255,.09),transparent 60%)';
      else if (t >= 22.4 && t < 26.6) bg = 'radial-gradient(60% 55% at 50% 42%,rgba(240,220,164,.20),transparent)';
      if (tintEl) { tintEl.style.background = bg; tintEl.style.opacity = bg === 'transparent' ? '0' : '1'; }
    };

    const tick = () => {
      const t = Math.min(performance.now() - startedAt.current, DURATION);
      elapsed.current = t;
      frameAt(t / 1000);
      if (t < DURATION) raf.current = requestAnimationFrame(tick);
      else setEnded(true);
    };
    tick();
    return () => cancelAnimationFrame(raf.current);
  }, [playing, mounted, noCanvas, reduced]);

  const replay = () => {
    elapsed.current = 0;
    setEnded(false);
    const stage = stageRef.current;
    if (stage) { stage.classList.remove('playing'); void stage.offsetWidth; }
    setPlaying(true);
  };

  const cls = ['ec-teaser', reduced ? 'reduced' : '', lite ? 'lite' : '', standalone ? 'standalone' : ''].filter(Boolean).join(' ');

  return (
    <div className={cls} ref={hostRef} style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#000' }}>
      <div className="tz-stage" ref={stageRef} data-ratio="16x9">
        <div className="tz-camera">
          <div className="tz-grid" />
          <div className="tz-sweep" />
          {STARS.map(([top, left, tw, td], i) => (
            <span key={i} className="tz-bgstar" style={{ top: `${top}cqmin`, left: `${left}cqw`, ['--tw' as string]: `${tw}s`, ['--td' as string]: `${td}s` }} />
          ))}

          {mounted && (
            <>
              {/* COLD OPEN */}
              <section className="tz-beat" style={{ ['--in' as string]: '.4s', ['--out' as string]: '1.75s' }}>
                <p className="tz-stamp">NexGen PLC presents</p>
              </section>

              {/* B1 · headline */}
              <section className="tz-beat" style={{ ['--in' as string]: '1.9s', ['--out' as string]: '4.7s' }}>
                <p className="tz-eyebrow" style={{ ['--i' as string]: 0 }}>FILE/01 · ANNOUNCEMENT</p>
                <h1 className="tz-h1 tz-silver">
                  <span className="tz-word" style={{ ['--i' as string]: 1 }}>Ethiopia&apos;s</span>{' '}
                  <span className="tz-word" style={{ ['--i' as string]: 2 }}>first</span><br />
                  <span className="tz-word" style={{ ['--i' as string]: 3 }}>national</span>{' '}
                  <span className="tz-word" style={{ ['--i' as string]: 4 }}>FC</span>{' '}
                  <span className="tz-word" style={{ ['--i' as string]: 5 }}>league.</span>
                </h1>
              </section>

              {/* B2 · the duel */}
              <section className="tz-beat b2" style={{ ['--in' as string]: '4.9s', ['--out' as string]: '9.6s' }}>
                <p className="tz-eyebrow" style={{ ['--i' as string]: 0 }}>EVERY TIE · BEST OF THREE</p>
                <div className="tz-duel" style={{ ['--i' as string]: 1 }}>
                  <div className="tz-fighter" id="tz-f1">
                    <span className="tz-lbl">Player</span>
                    <span className="tz-tag">ABEL.ET</span>
                    <span className="tz-score" id="tz-s1">0</span>
                    <div className="tz-gamelights" id="tz-g1"><i className="tz-gl" /><i className="tz-gl" /><i className="tz-gl" /></div>
                    <span className="tz-adv" id="tz-adv1">Advances</span>
                  </div>
                  <span className="tz-vs">VS</span>
                  <div className="tz-fighter p2" id="tz-f2">
                    <span className="tz-lbl">Player</span>
                    <span className="tz-tag">YONI_10</span>
                    <span className="tz-score" id="tz-s2">0</span>
                    <div className="tz-gamelights" id="tz-g2"><i className="tz-gl" /><i className="tz-gl" /><i className="tz-gl" /></div>
                    <span className="tz-adv" id="tz-adv2">Advances</span>
                  </div>
                </div>
                <p className="tz-sub" style={{ ['--i' as string]: 2 }}>win two games · or go home</p>
              </section>

              {/* B3 · cascade */}
              <section className="tz-beat b3" style={{ ['--in' as string]: '9.8s', ['--out' as string]: '13.7s' }}>
                <p className="tz-eyebrow" style={{ ['--i' as string]: 0 }}>PHASE ONE · OPEN QUALIFIERS</p>
                <div className="tz-cascade" style={{ ['--i' as string]: 1 }}>
                  {Array.from({ length: CELLS }, (_, i) => <span key={i} className="tz-cell" />)}
                </div>
                <div className="tz-countrow" style={{ ['--i' as string]: 2 }}>
                  <span className="tz-sub">no entry limit · twenty brackets · one wins each slot</span>
                </div>
              </section>

              {/* B4 · slots claimed */}
              <section className="tz-beat b4" style={{ ['--in' as string]: '13.9s', ['--out' as string]: '17.7s' }}>
                <p className="tz-eyebrow" style={{ ['--i' as string]: 0 }}>PHASE TWO · DRAFT DAY</p>
                <div className="tz-slots" style={{ ['--i' as string]: 1 }}>
                  {CLUB_CODES.map((code) => (
                    <span key={code} className="tz-slot" data-code={code}>
                      <em style={{ fontStyle: 'normal' }}>—</em><em className="tz-tick">open</em>
                    </span>
                  ))}
                </div>
                <div className="tz-countrow" style={{ ['--i' as string]: 2 }}>
                  <span className="tz-bigcount tz-num" data-from="0" data-to="20" data-start="14.3" data-end="16.9">00</span>
                  <span className="tz-sub">club slots claimed</span>
                </div>
              </section>

              {/* B5 · the season */}
              <section className="tz-beat b5" style={{ ['--in' as string]: '17.9s', ['--out' as string]: '22.2s' }}>
                <p className="tz-eyebrow" style={{ ['--i' as string]: 0 }}>PHASE THREE · 38 GAMEWEEKS</p>
                <div className="tz-table" style={{ ['--i' as string]: 1 }}>
                  {ROWS.map((r) => (
                    <div key={r.code} className="tz-trow">
                      <span className="tz-pos">—</span>
                      <span className="tz-code">{r.code}</span>
                      <span className="tz-name">{r.name}</span>
                      <span className="tz-pts">0</span>
                    </div>
                  ))}
                </div>
                <p className="tz-sub" style={{ ['--i' as string]: 2 }}>380 fixtures · home and away · one table</p>
              </section>

              {/* B6 · the prize — sealed */}
              <section className="tz-beat b6" style={{ ['--in' as string]: '22.4s', ['--out' as string]: '26.6s' }}>
                <div className="tz-prizewrap">
                  <div className="tz-spot" />
                  <svg className="tz-constellation" viewBox="0 0 600 260" aria-hidden="true">
                    <polyline points="300,30 324,98 395,99 338,142 359,211 300,170 241,211 262,142 205,99 276,98 300,30" />
                    {[[300, 30, 4], [324, 98, 3], [395, 99, 4], [338, 142, 3], [359, 211, 4], [300, 170, 3], [241, 211, 4], [262, 142, 3], [205, 99, 4], [276, 98, 3]].map(([cx, cy, r], k) => (
                      <circle key={k} style={{ ['--k' as string]: k }} cx={cx} cy={cy} r={r} />
                    ))}
                  </svg>
                  <div className="tz-comet" />
                  {!noCanvas && <canvas className="tz-embers" ref={embersRef} />}
                  <p className="tz-eyebrow" style={{ ['--i' as string]: 0 }}>LOT 01 · GRAND PRIZE</p>
                  <div className="tz-carbox" style={{ ['--i' as string]: 1 }}>
                    <svg viewBox="0 0 900 340" role="img" aria-label="A vehicle beneath a cover">
                      <defs>
                        <linearGradient id="tzdg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2B2820" /><stop offset="45%" stopColor="#181713" /><stop offset="100%" stopColor="#080807" />
                        </linearGradient>
                        <linearGradient id="tzsheen" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgba(255,255,255,0)" /><stop offset="30%" stopColor="rgba(255,244,214,0.10)" />
                          <stop offset="46%" stopColor="rgba(255,255,255,0)" /><stop offset="62%" stopColor="rgba(255,244,214,0.06)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                        <radialGradient id="tzglow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="rgba(200,162,78,.30)" /><stop offset="100%" stopColor="rgba(200,162,78,0)" />
                        </radialGradient>
                      </defs>
                      <ellipse cx="450" cy="326" rx="380" ry="18" fill="rgba(0,0,0,.6)" />
                      <ellipse cx="450" cy="324" rx="300" ry="12" fill="url(#tzglow)" />
                      <g>
                        <circle cx="222" cy="300" r="36" fill="#0A0A0B" stroke="#232326" strokeWidth="3" />
                        <circle cx="222" cy="300" r="13" fill="#131109" stroke="rgba(200,162,78,.55)" strokeWidth="2" />
                        <circle cx="668" cy="300" r="36" fill="#0A0A0B" stroke="#232326" strokeWidth="3" />
                        <circle cx="668" cy="300" r="13" fill="#131109" stroke="rgba(200,162,78,.55)" strokeWidth="2" />
                      </g>
                      <path className="tz-drape" d={CAR_CLOSED} />
                      <path d={CAR_CLOSED} fill="url(#tzsheen)" />
                      <g fill="none" strokeLinecap="round">
                        <path d="M300 208 C312 244 318 272 320 296" stroke="rgba(0,0,0,.35)" strokeWidth="3" />
                        <path d="M418 146 C424 200 428 252 430 300" stroke="rgba(0,0,0,.30)" strokeWidth="3" />
                        <path d="M540 150 C548 200 552 250 554 300" stroke="rgba(0,0,0,.30)" strokeWidth="3" />
                        <path d="M648 206 C654 240 658 268 660 292" stroke="rgba(0,0,0,.35)" strokeWidth="3" />
                        <path d="M310 206 C322 244 328 272 330 296" stroke="rgba(255,255,255,.05)" strokeWidth="2" />
                        <path d="M428 146 C434 200 438 252 440 300" stroke="rgba(255,255,255,.05)" strokeWidth="2" />
                        <path d="M550 152 C558 202 562 250 564 300" stroke="rgba(255,255,255,.05)" strokeWidth="2" />
                      </g>
                      <path d="M735 232 C737 254 739 272 740 288" stroke="rgba(200,162,78,.45)" strokeWidth="2.5" fill="none" strokeDasharray="4 6" />
                      <g transform="translate(752 252) rotate(8)">
                        <rect x="0" y="0" width="64" height="26" fill="#0E0D0A" stroke="rgba(200,162,78,.6)" strokeWidth="1.5" />
                        <text x="32" y="17" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="11" letterSpacing="2" fill="#C8A24E">SEALED</text>
                      </g>
                      <path className="tz-rim" d={CAR_PATH} />
                    </svg>
                    <div className="tz-shine"><i /></div>
                  </div>
                  <div className="tz-plate" style={{ ['--i' as string]: 2 }}>
                    <div><b>1</b><span>car</span></div>
                    <div><b>100%</b><span>electric</span></div>
                    <div><b>SEALED</b><span>reveal on broadcast</span></div>
                  </div>
                  <p className="tz-wish" style={{ ['--i' as string]: 3 }}>Make a wish.</p>
                </div>
              </section>

              {/* B7 · end card — reads live registration state */}
              <section className="tz-beat last" style={{ ['--in' as string]: '26.8s' }}>
                <div className="tz-lockup">
                  <div className="tz-badge" style={{ ['--i' as string]: 0 }}>E</div>
                  <p className="tz-eyebrow" style={{ ['--i' as string]: 1 }}>NexGen PLC presents</p>
                  <div className="tz-wordmark" style={{ ['--i' as string]: 2 }}>Electrocup <b>26</b></div>
                  <div className="tz-rule" style={{ ['--i' as string]: 3 }} />
                  <div className="tz-datebar" style={{ ['--i' as string]: 4 }}>
                    {open ? 'Registration open' : <>Registration opens {REGISTRATION_OPENS_TIME}</>}
                  </div>
                  <div className="tz-sub" style={{ ['--i' as string]: 5 }}>All twenty clubs · top-ten brackets close first</div>
                  {open
                    ? <Link href="/register" className="tz-cta" style={{ ['--i' as string]: 6 }}>REGISTER NOW →</Link>
                    : <div className="tz-url" style={{ ['--i' as string]: 6 }}>nexgentournaments.com</div>}
                  <div className="tz-endstrip" style={{ ['--in2' as string]: '28.6s' }}>
                    <div className="tz-partner">Official vehicle partner &nbsp;·&nbsp; <b>Kairos Addis Auto</b></div>
                    <p className="tz-notice">
                      Not affiliated with, endorsed by or sponsored by Electronic Arts Inc. or its licensors,
                      nor by the Premier League or any club. Played on EA SPORTS FC 26 and EA SPORTS FC 27.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="tz-mark tl">EC/26 · TEASER</div>
          <div className="tz-mark tr">NEXGEN PLC · ORGANISER</div>
          <div className="tz-mark bl">ADDIS ABABA · ETHIOPIA</div>
          <div className="tz-mark br">EDITION 01</div>
        </div>

        {!noCanvas && <canvas className="tz-fx" ref={fxRef} />}
        <div className="tz-pulse" />
        <div className="tz-tint" />
        <div className="tz-flash" />
        <div className="tz-vignette" />
        <div className="tz-grain" />
        <div className="tz-bars top" />
        <div className="tz-bars bot" />
      </div>

      {ended && (
        <button type="button" onClick={replay} className="tz-replay mono" aria-label="Replay the teaser">
          REPLAY ↺
        </button>
      )}

      <Css>{TEASER_CSS}</Css>
    </div>
  );
}

const TEASER_CSS = `
.ec-teaser{--tz-gold:#C8A24E;--tz-gold-hi:#F0DCA4;--tz-gold-deep:#8E6F2C;
  --tz-gold-dim:rgba(200,162,78,.22);--tz-gold-line:rgba(200,162,78,.10);
  --tz-white:#F4F4F5;--tz-mute:#6E7076;--tz-dead:#2A2B2E;line-height:1.5}
.ec-teaser .tz-stage{position:relative;width:1920px;height:1080px;overflow:hidden;
  transform-origin:top left;container-type:size;container-name:tzstage;background:#000;color:var(--tz-white)}
.ec-teaser.standalone .tz-stage{position:absolute}
.ec-teaser .tz-camera{position:absolute;inset:0;
  background:radial-gradient(120% 90% at 50% 0%,#0A0A0B 0%,#030303 55%,#000 100%)}
.ec-teaser .tz-stage.playing .tz-camera{animation:tzdrift 30s ease-in-out both,
  tzshake .32s linear 6.0s 1,tzshake .32s linear 7.2s 1,
  tzshakeBig .45s linear 8.4s 1,tzshakeBig .5s linear 23.1s 1}
@keyframes tzdrift{0%{transform:scale(1.04)}16%{transform:scale(1)}33%{transform:scale(1.03) translateY(-.4cqmin)}
  52%{transform:scale(1)}74%{transform:scale(1.035) translateY(.3cqmin)}88%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes tzshake{0%,100%{translate:0 0}20%{translate:.5cqmin -.3cqmin}40%{translate:-.45cqmin .3cqmin}
  60%{translate:.3cqmin .2cqmin}80%{translate:-.2cqmin -.2cqmin}}
@keyframes tzshakeBig{0%,100%{translate:0 0}15%{translate:.9cqmin -.6cqmin}35%{translate:-.8cqmin .55cqmin}
  55%{translate:.6cqmin .4cqmin}75%{translate:-.4cqmin -.3cqmin}}
.ec-teaser .tz-grid{position:absolute;inset:0;opacity:0;
  background-image:linear-gradient(to right,var(--tz-gold-line) 1px,transparent 1px),
  linear-gradient(to bottom,var(--tz-gold-line) 1px,transparent 1px);background-size:6.2cqmin 6.2cqmin;
  -webkit-mask-image:radial-gradient(120% 80% at 50% 45%,#000 25%,transparent 78%);
  mask-image:radial-gradient(120% 80% at 50% 45%,#000 25%,transparent 78%)}
.ec-teaser .tz-sweep{position:absolute;top:0;bottom:0;width:2px;left:-4%;opacity:0;
  background:linear-gradient(to bottom,transparent,var(--tz-gold),transparent);
  box-shadow:0 0 6cqmin 1.2cqmin rgba(200,162,78,.28)}
.ec-teaser .tz-vignette{position:absolute;inset:0;pointer-events:none;z-index:6;
  background:radial-gradient(70% 60% at 50% 50%,transparent 36%,rgba(0,0,0,.82) 100%)}
.ec-teaser .tz-grain{position:absolute;inset:-8%;pointer-events:none;z-index:7;opacity:.055;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")}
.ec-teaser .tz-stage.playing .tz-grain{animation:tzgrain 1.2s steps(6) infinite}
.ec-teaser.lite .tz-stage.playing .tz-grain,
.ec-teaser.reduced .tz-stage.playing .tz-grain{animation:none}
@keyframes tzgrain{0%{transform:translate(0,0)}17%{transform:translate(-3%,2%)}34%{transform:translate(2%,-3%)}
  51%{transform:translate(-2%,-2%)}68%{transform:translate(3%,1%)}85%{transform:translate(1%,3%)}100%{transform:translate(0,0)}}
.ec-teaser .tz-bars{position:absolute;left:0;right:0;height:6.5cqmin;background:#000;z-index:8;pointer-events:none}
.ec-teaser .tz-bars.top{top:0}.ec-teaser .tz-bars.bot{bottom:0}
.ec-teaser .tz-mark{position:absolute;font-family:var(--f-mono);font-size:1.05cqmin;letter-spacing:.28em;
  color:var(--tz-mute);text-transform:uppercase;opacity:0;z-index:5}
.ec-teaser .tz-mark.tl{top:8cqmin;left:4.5cqmin}
.ec-teaser .tz-mark.tr{top:8cqmin;right:4.5cqmin;color:var(--tz-gold)}
.ec-teaser .tz-mark.bl{bottom:8cqmin;left:4.5cqmin}
.ec-teaser .tz-mark.br{bottom:8cqmin;right:4.5cqmin}
.ec-teaser .tz-beat{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:2.8cqmin;padding:0 5cqw;text-align:center;opacity:0;z-index:3}
.ec-teaser .tz-eyebrow{font-family:var(--f-mono);font-size:1.3cqmin;letter-spacing:.42em;color:var(--tz-gold);text-transform:uppercase}
.ec-teaser .tz-sub{font-family:var(--f-mono);font-size:1.25cqmin;letter-spacing:.3em;color:var(--tz-mute);text-transform:uppercase}
.ec-teaser .tz-rule{width:9cqmin;height:1px;background:var(--tz-gold);opacity:.7}
.ec-teaser .tz-h1{font-family:var(--f-display);font-weight:400;text-transform:uppercase;line-height:.88;
  letter-spacing:-.012em;font-size:10.6cqmin;max-width:min(88cqw,164cqmin);margin:0}
.ec-teaser .tz-silver{background:linear-gradient(178deg,#FFF 8%,#B9BDC6 62%,#83878F 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent}
.ec-teaser .tz-word{display:inline-block;opacity:0}
.ec-teaser .tz-stamp{font-family:var(--f-mono);font-size:1.5cqmin;letter-spacing:.55em;color:var(--tz-mute);text-transform:uppercase;opacity:0}
.ec-teaser .tz-stage.playing .tz-stamp{animation:tzflicker 1.1s steps(1) .55s both,tzfadeOut .3s ease 1.75s forwards}
@keyframes tzflicker{0%{opacity:0}8%{opacity:1}14%{opacity:.15}22%{opacity:1}30%{opacity:.35}38%{opacity:1}100%{opacity:1}}
.ec-teaser .tz-duel{display:flex;align-items:center;gap:4.5cqmin}
.ec-teaser .tz-fighter{display:flex;flex-direction:column;align-items:center;gap:1.4cqmin;padding:2.6cqmin 4cqmin;
  border:1px solid rgba(255,255,255,.12);background:linear-gradient(165deg,rgba(255,255,255,.05),transparent);min-width:26cqmin}
.ec-teaser .tz-tag{font-family:var(--f-display);font-size:4.6cqmin;letter-spacing:.02em}
.ec-teaser .tz-score{font-family:var(--f-display);font-size:8.2cqmin;line-height:1;color:var(--tz-white)}
.ec-teaser .tz-lbl{font-family:var(--f-mono);font-size:1cqmin;letter-spacing:.32em;color:var(--tz-mute);text-transform:uppercase}
.ec-teaser .tz-fighter.lead{border-color:var(--tz-gold);background:linear-gradient(165deg,rgba(200,162,78,.2),transparent)}
.ec-teaser .tz-fighter.lead .tz-score{color:var(--tz-gold-hi)}
.ec-teaser .tz-fighter.out{opacity:.28;filter:grayscale(1)}
.ec-teaser .tz-adv{font-family:var(--f-mono);font-size:1.05cqmin;letter-spacing:.4em;color:#12100A;
  background:var(--tz-gold);padding:.7cqmin 1.8cqmin;text-transform:uppercase;opacity:0;transform:scale(.7)}
.ec-teaser .tz-adv.on{opacity:1;transform:scale(1);transition:all .25s cubic-bezier(.2,1.4,.4,1)}
.ec-teaser .tz-vs{font-family:var(--f-display);font-size:5.4cqmin;color:var(--tz-gold);opacity:.9}
.ec-teaser .tz-gamelights{display:flex;gap:1.2cqmin}
.ec-teaser .tz-gl{width:2.2cqmin;height:.55cqmin;background:rgba(255,255,255,.14);display:block}
.ec-teaser .tz-gl.won{background:var(--tz-gold)}
.ec-teaser .tz-gl.lost{background:rgba(255,255,255,.35)}
.ec-teaser .tz-fighter.p2.lead{border-color:#4EC8FF;background:linear-gradient(165deg,rgba(78,200,255,.22),transparent)}
.ec-teaser .tz-fighter.p2.lead .tz-score{color:#BFE9FF}
.ec-teaser .tz-fighter.p2 .tz-gl.won{background:#4EC8FF}
.ec-teaser .tz-cascade{display:grid;grid-template-columns:repeat(16,1fr);gap:.85cqmin;width:min(80cqw,128cqmin)}
.ec-teaser .tz-cell{aspect-ratio:1/1;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.03)}
.ec-teaser .tz-cell.alive{border-color:var(--tz-gold-dim);background:rgba(200,162,78,.10)}
.ec-teaser .tz-cell.hot{border-color:#E8524E;background:rgba(232,82,78,.55);box-shadow:0 0 1.8cqmin rgba(232,82,78,.6)}
.ec-teaser .tz-cell.champ{border-color:var(--tz-gold);background:rgba(200,162,78,.6);box-shadow:0 0 2.4cqmin rgba(200,162,78,.75)}
.ec-teaser .tz-cell.out{border-color:rgba(255,255,255,.05);background:transparent;opacity:.2}
.ec-teaser .tz-slots{display:grid;grid-template-columns:repeat(10,1fr);gap:1cqmin;width:min(84cqw,146cqmin)}
.ec-teaser .tz-slot{aspect-ratio:1/1;border:1px solid rgba(255,255,255,.10);display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:.4cqmin;font-family:var(--f-mono);font-size:1.6cqmin;
  letter-spacing:.05em;color:var(--tz-dead);background:linear-gradient(160deg,rgba(255,255,255,.04),transparent)}
.ec-teaser .tz-tick{font-size:.85cqmin;letter-spacing:.2em;color:transparent;font-style:normal}
.ec-teaser .tz-slot.claimed{border-color:var(--tz-gold-dim);color:var(--tz-gold);background:linear-gradient(160deg,rgba(200,162,78,.16),transparent)}
.ec-teaser .tz-slot.claimed .tz-tick{color:var(--tz-mute)}
.ec-teaser .tz-slot.flash{border-color:var(--tz-gold);background:rgba(200,162,78,.45);color:#12100A}
.ec-teaser .tz-bigcount{font-family:var(--f-display);font-size:8.4cqmin;color:var(--tz-gold);line-height:1}
.ec-teaser .tz-countrow{display:flex;align-items:baseline;gap:2cqmin}
.ec-teaser .tz-table{position:relative;width:min(70cqw,112cqmin)}
.ec-teaser .tz-trow{position:absolute;left:0;right:0;display:flex;align-items:center;gap:2cqmin;
  padding:1.4cqmin 2.4cqmin;border:1px solid rgba(255,255,255,.09);
  background:linear-gradient(90deg,rgba(255,255,255,.045),transparent);
  font-family:var(--f-mono);font-size:1.6cqmin;letter-spacing:.12em;color:#B9BBC0}
.ec-teaser .tz-pos{width:3.4cqmin;color:var(--tz-mute)}
.ec-teaser .tz-code{font-family:var(--f-display);font-size:2.5cqmin;color:var(--tz-white)}
.ec-teaser .tz-name{flex:1;text-align:left;color:var(--tz-mute);font-size:1.3cqmin;letter-spacing:.24em}
.ec-teaser .tz-pts{font-family:var(--f-display);font-size:2.7cqmin;color:var(--tz-white)}
.ec-teaser .tz-trow.lead{border-color:var(--tz-gold);background:linear-gradient(90deg,rgba(200,162,78,.24),transparent)}
.ec-teaser .tz-trow.lead .tz-code,.ec-teaser .tz-trow.lead .tz-pts{color:var(--tz-gold-hi)}
.ec-teaser .tz-prizewrap{position:relative;display:flex;flex-direction:column;align-items:center;gap:2.8cqmin}
.ec-teaser .tz-spot{position:absolute;top:-16cqmin;left:50%;transform:translateX(-50%);width:120cqmin;height:80cqmin;
  pointer-events:none;background:radial-gradient(50% 50% at 50% 42%,rgba(200,162,78,.26),transparent 70%)}
.ec-teaser .tz-embers{position:absolute;inset:-20% -10%;pointer-events:none;z-index:-1;width:120%;height:140%}
.ec-teaser .tz-carbox{position:relative;width:min(76cqw,116cqmin)}
.ec-teaser .tz-carbox svg{width:100%;display:block}
.ec-teaser .tz-drape{fill:url(#tzdg)}
.ec-teaser .tz-rim{fill:none;stroke:var(--tz-gold);stroke-width:2.4;stroke-dasharray:2400;stroke-dashoffset:2400}
.ec-teaser .tz-stage.playing .tz-beat.b6 .tz-rim{animation:tzdraw 2.1s cubic-bezier(.4,0,.2,1) calc(var(--in) + .25s) both}
@keyframes tzdraw{to{stroke-dashoffset:0}}
.ec-teaser .tz-shine{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.ec-teaser .tz-shine i{position:absolute;top:-40%;bottom:-40%;width:14%;left:-25%;
  background:linear-gradient(90deg,transparent,rgba(255,240,200,.6),transparent);transform:skewX(-18deg);opacity:0}
.ec-teaser .tz-stage.playing .tz-beat.b6 .tz-shine i{animation:tzshine 1.5s cubic-bezier(.4,0,.3,1) calc(var(--in) + 1.6s) both}
@keyframes tzshine{0%{left:-25%;opacity:0}20%{opacity:1}100%{left:110%;opacity:0}}
.ec-teaser .tz-plate{display:flex;align-items:stretch;border:1px solid var(--tz-gold-dim)}
.ec-teaser .tz-plate div{padding:1.4cqmin 3cqmin;border-right:1px solid var(--tz-gold-dim);text-align:center}
.ec-teaser .tz-plate div:last-child{border-right:none}
.ec-teaser .tz-plate b{display:block;font-family:var(--f-display);font-size:3cqmin;color:var(--tz-gold);font-weight:400}
.ec-teaser .tz-plate span{font-family:var(--f-mono);font-size:.95cqmin;letter-spacing:.28em;color:var(--tz-mute);text-transform:uppercase}
.ec-teaser .tz-lockup{display:flex;flex-direction:column;align-items:center;gap:2.2cqmin}
.ec-teaser .tz-badge{width:8.8cqmin;height:8.8cqmin;border:1px solid var(--tz-gold-dim);display:flex;align-items:center;
  justify-content:center;font-family:var(--f-display);font-size:5cqmin;color:var(--tz-gold);
  background:linear-gradient(150deg,rgba(200,162,78,.14),transparent 65%)}
.ec-teaser .tz-wordmark{font-family:var(--f-display);font-size:7.8cqmin;text-transform:uppercase}
.ec-teaser .tz-wordmark b{color:var(--tz-gold);font-weight:400}
.ec-teaser .tz-datebar{display:flex;gap:2.2cqmin;font-family:var(--f-mono);font-size:1.4cqmin;letter-spacing:.32em;
  text-transform:uppercase;color:var(--tz-white)}
.ec-teaser .tz-url{font-family:var(--f-mono);font-size:1.3cqmin;letter-spacing:.3em;color:var(--tz-gold);text-transform:uppercase}
.ec-teaser .tz-cta{font-family:var(--f-mono);font-size:1.3cqmin;letter-spacing:.3em;text-transform:uppercase;
  color:#12100A;background:var(--tz-gold);padding:1.2cqmin 2.6cqmin;text-decoration:none}
.ec-teaser .tz-endstrip{opacity:0;display:flex;flex-direction:column;align-items:center;gap:1.3cqmin;margin-top:2.4cqmin;
  padding-top:2cqmin;border-top:1px solid rgba(255,255,255,.09);width:min(76cqw,116cqmin)}
.ec-teaser .tz-partner{font-family:var(--f-mono);font-size:1.2cqmin;letter-spacing:.3em;color:#9A9CA2;text-transform:uppercase}
.ec-teaser .tz-partner b{color:var(--tz-gold);font-weight:400}
.ec-teaser .tz-notice{font-family:var(--f-mono);font-size:.88cqmin;letter-spacing:.14em;line-height:1.75;color:#4E5055;
  text-transform:uppercase;max-width:72cqmin;margin:0}
@keyframes tzgridIn{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:none}}
@keyframes tzsweepGo{0%{opacity:0;left:-4%}12%{opacity:1}100%{opacity:0;left:104%}}
@keyframes tzfadeIn{from{opacity:0}to{opacity:1}}
@keyframes tzfadeOut{to{opacity:0}}
@keyframes tzriseIn{from{opacity:0;transform:translateY(1.4cqmin)}to{opacity:1;transform:none}}
@keyframes tzpunchIn{from{opacity:0;transform:scale(1.12)}to{opacity:1;transform:scale(1)}}
.ec-teaser .tz-stage.playing .tz-grid{animation:tzgridIn 1.4s cubic-bezier(.16,1,.3,1) .1s both}
.ec-teaser .tz-stage.playing .tz-sweep{animation:tzsweepGo 1.5s cubic-bezier(.5,0,.2,1) .2s both}
.ec-teaser .tz-stage.playing .tz-mark{animation:tzfadeIn .8s ease 1.9s both}
.ec-teaser .tz-stage.playing .tz-beat{animation:tzfadeIn .45s cubic-bezier(.2,.7,.3,1) var(--in) both,
  tzfadeOut .3s ease var(--out) forwards}
.ec-teaser .tz-stage.playing .tz-beat.last{animation:tzfadeIn .55s cubic-bezier(.2,.7,.3,1) var(--in) both}
.ec-teaser .tz-stage.playing .tz-word{animation:tzpunchIn .55s cubic-bezier(.16,1,.3,1) calc(var(--in) + .1s * var(--i)) both}
.ec-teaser .tz-stage.playing .tz-beat > .tz-eyebrow,
.ec-teaser .tz-stage.playing .tz-beat > .tz-sub,
.ec-teaser .tz-stage.playing .tz-beat > .tz-countrow,
.ec-teaser .tz-stage.playing .tz-beat > .tz-cascade,
.ec-teaser .tz-stage.playing .tz-beat > .tz-slots,
.ec-teaser .tz-stage.playing .tz-beat > .tz-table,
.ec-teaser .tz-stage.playing .tz-beat > .tz-duel,
.ec-teaser .tz-stage.playing .tz-prizewrap > *,
.ec-teaser .tz-stage.playing .tz-lockup > *{animation:tzriseIn .6s cubic-bezier(.16,1,.3,1) calc(var(--in) + .1s * var(--i,0)) both}
.ec-teaser .tz-stage.playing .tz-endstrip{animation:tzriseIn .8s cubic-bezier(.16,1,.3,1) var(--in2) both}
.ec-teaser .tz-bgstar{position:absolute;width:.55cqmin;height:.55cqmin;z-index:1;pointer-events:none;border-radius:50%;
  background:radial-gradient(circle,#FFF6DC 0%,rgba(255,246,220,0) 70%);opacity:0}
.ec-teaser .tz-stage.playing .tz-bgstar{animation:tztwinkle var(--tw,3s) ease-in-out var(--td,0s) infinite}
@keyframes tztwinkle{0%,100%{opacity:.07}50%{opacity:.4}}
.ec-teaser .tz-constellation{position:absolute;top:-27cqmin;left:50%;transform:translateX(-50%);
  width:58cqmin;height:26cqmin;pointer-events:none}
.ec-teaser .tz-constellation circle{fill:#FFF3D6;opacity:0;transform-box:fill-box;transform-origin:center;scale:.2;
  filter:drop-shadow(0 0 .6cqmin rgba(255,240,200,.8))}
.ec-teaser .tz-constellation polyline{fill:none;stroke:rgba(240,220,164,.45);stroke-width:1.2;
  stroke-dasharray:900;stroke-dashoffset:900}
.ec-teaser .tz-stage.playing .tz-beat.b6 .tz-constellation circle{animation:tzstarPop .5s cubic-bezier(.2,1.4,.4,1) calc(var(--in) + .5s + .12s*var(--k)) both}
@keyframes tzstarPop{to{opacity:.95;scale:1}}
.ec-teaser .tz-stage.playing .tz-beat.b6 .tz-constellation polyline{animation:tzstarLine 1.5s ease calc(var(--in) + 2.0s) both}
@keyframes tzstarLine{to{stroke-dashoffset:0}}
.ec-teaser .tz-comet{position:absolute;top:5cqmin;left:6cqmin;width:26cqmin;height:2px;opacity:0;transform:rotate(24deg);
  transform-origin:left center;background:linear-gradient(90deg,rgba(255,246,220,0),#FFF6DC 70%,#FFF);
  filter:drop-shadow(0 0 1cqmin rgba(255,240,200,.9))}
.ec-teaser .tz-stage.playing .tz-beat.b6 .tz-comet{animation:tzcomet .55s cubic-bezier(.35,0,.75,.4) calc(var(--in) + .2s) both}
@keyframes tzcomet{0%{opacity:0;translate:0 0}12%{opacity:1}100%{opacity:0;translate:54cqmin 25cqmin}}
.ec-teaser .tz-wish{font-family:var(--f-display);font-size:3.4cqmin;letter-spacing:.06em;text-transform:uppercase;
  background:linear-gradient(178deg,var(--tz-gold-hi) 6%,var(--tz-gold) 58%,var(--tz-gold-deep) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;margin:0}
.ec-teaser .tz-tint{position:absolute;inset:0;z-index:2;pointer-events:none;mix-blend-mode:screen;opacity:0}
.ec-teaser .tz-fx{position:absolute;inset:0;z-index:5;pointer-events:none;width:100%;height:100%}
.ec-teaser .tz-pulse{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;
  background:radial-gradient(62% 52% at 50% 50%,transparent 52%,rgba(232,82,78,.36) 100%)}
.ec-teaser .tz-flash{position:absolute;inset:0;z-index:9;pointer-events:none;background:#FFF3D6;opacity:0}
.ec-teaser .tz-replay{position:absolute;right:18px;bottom:18px;z-index:12;cursor:pointer;
  font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#E8E8EA;
  background:rgba(10,10,11,.72);border:1px solid rgba(255,255,255,.18);padding:9px 14px;backdrop-filter:blur(6px)}
.ec-teaser .tz-replay:hover{background:rgba(200,162,78,.18);border-color:var(--tz-gold)}
/* Reduced motion: fades only. No drift, grain, particles, shakes, twinkle or
   comet travel — the constellation and the washes still carry the beat. */
.ec-teaser.reduced .tz-stage.playing .tz-camera{animation:none}
.ec-teaser.reduced .tz-stage.playing .tz-bgstar{animation:none;opacity:.28}
.ec-teaser.reduced .tz-stage.playing .tz-beat.b6 .tz-comet{animation:tzfadeIn .3s ease calc(var(--in) + .2s) both;opacity:.5}
.ec-teaser.reduced .tz-stage.playing .tz-word,
.ec-teaser.reduced .tz-stage.playing .tz-beat > *,
.ec-teaser.reduced .tz-stage.playing .tz-prizewrap > *,
.ec-teaser.reduced .tz-stage.playing .tz-lockup > *{animation:tzfadeIn .35s ease calc(var(--in) + .04s * var(--i,0)) both}
.ec-teaser.reduced .tz-stage.playing .tz-sweep{animation:none}
@media (max-width:760px){
  .ec-teaser .tz-mark{display:none}
}
`;
