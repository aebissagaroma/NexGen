'use client';
// Live bracket viewer — reads real matches from the DB (empty until drawn).
import * as React from 'react';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { CLUBS } from '@/data/static';

interface Match { id: string; club_code: string; round: string; slot: number; player_a: string | null; player_b: string | null; score_a: number | null; score_b: number | null; winner: string | null; }
const ROUND_ORDER = ['RD256', 'RD64', 'RD16', 'QF', 'FINAL'];
const ROUND_LABEL: Record<string, string> = { RD256: 'Round of 256', RD64: 'Round of 64', RD16: 'Round of 16', QF: 'Quarter-finals', FINAL: 'Final' };

export default function BracketPage() {
  const [club, setClub] = React.useState('MCI');
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/brackets?club=${club}`).then((r) => r.json()).then((d) => { setMatches(d.matches || []); setLoading(false); }).catch(() => setLoading(false));
  }, [club]);

  const byRound = ROUND_ORDER.map((r) => ({ round: r, items: matches.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader />
      <div className="page-wrap">
        <PageTitle file="FILE/04 · BRACKETS" title={<>QUALIFIER<br /><span style={{ color: 'var(--accent-glow)' }}>BRACKETS.</span></>} sub="Single-elimination, BO3 throughout. Brackets are drawn live on 30 September 2026 — until then this view is empty." />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          {CLUBS.map((c) => (
            <button key={c.code} onClick={() => setClub(c.code)} className="mono" style={{ padding: '8px 12px', fontSize: 11, letterSpacing: '.1em', border: '1px solid ' + (club === c.code ? 'var(--accent)' : 'var(--line-2)'), background: club === c.code ? 'rgba(var(--accent-rgb),0.1)' : 'var(--bg-1)', color: club === c.code ? 'var(--accent-glow)' : 'var(--ink-2)', borderRadius: 2 }}>{c.code}</button>
          ))}
        </div>

        {loading ? (
          <div className="mono" style={{ color: 'var(--ink-3)', letterSpacing: '.18em', fontSize: 12 }}>LOADING…</div>
        ) : byRound.length === 0 ? (
          <div className="ticks" style={{ position: 'relative', border: '1px solid var(--line-2)', background: 'linear-gradient(180deg, var(--bg-1), var(--bg))', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: 40 }}>
            <span className="tk1" /><span className="tk2" />
            <span className="mono" style={{ fontSize: 10, letterSpacing: '.26em', color: 'var(--accent-glow)' }}>NOT YET DRAWN</span>
            <div className="display" style={{ fontSize: 'clamp(32px,5vw,56px)', lineHeight: 0.95 }}>{CLUBS.find((c) => c.code === club)?.name}<br /><span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>DRAWS 30 SEP 2026</span></div>
            <p style={{ color: 'var(--ink-2)', maxWidth: '46ch', fontSize: 14.5 }}>Seeded by ELO and drawn on the live broadcast. Register now to claim a spot in this bracket.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 16 }}>
            {byRound.map((g) => (
              <div key={g.round} style={{ minWidth: 240, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--accent-glow)' }}>{ROUND_LABEL[g.round] || g.round}</div>
                {g.items.map((m) => <MatchCard key={m.id} m={m} />)}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function MatchCard({ m }: { m: Match }) {
  const row = (name: string | null, score: number | null, isWinner: boolean) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', color: isWinner ? 'var(--ink)' : 'var(--ink-3)', fontWeight: isWinner ? 700 : 400 }}>
      <span className="display-2" style={{ fontSize: 14 }}>{name || 'TBD'}</span>
      <span className="mono num" style={{ fontSize: 13 }}>{score ?? '–'}</span>
    </div>
  );
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {row(m.player_a, m.score_a, m.winner === 'a')}
      <div style={{ height: 1, background: 'var(--line)' }} />
      {row(m.player_b, m.score_b, m.winner === 'b')}
    </div>
  );
}
