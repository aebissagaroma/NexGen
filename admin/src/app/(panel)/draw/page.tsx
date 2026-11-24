// Draw & results — generates each club's knockout bracket from CONFIRMED
// entries and records match results (winner advances automatically). The
// public /bracket page renders whatever this writes, live.
import Link from 'next/link';
import { query } from '@/lib/db';
import { DrawControls, ResultForm } from './draw-controls';

export const dynamic = 'force-dynamic';

const ROUND_LABEL: Record<string, string> = {
  RD256: 'Round of 256', RD128: 'Round of 128', RD64: 'Round of 64', RD32: 'Round of 32',
  RD16: 'Round of 16', QF: 'Quarter-finals', SF: 'Semi-finals', FINAL: 'Final',
};
const ROUND_ORDER = Object.keys(ROUND_LABEL);

export default async function DrawPage({ searchParams }: { searchParams: { club?: string } }) {
  const clubs = await query<{ code: string; name: string; grp: string; confirmed: number; drawn: boolean }>(
    `SELECT c.code, c.name, c.grp,
            (SELECT COUNT(*) FROM registrations r WHERE r.club_code = c.code AND r.id_status = 'confirmed' AND r.status <> 'rejected' AND r.gamertag IS NOT NULL)::int AS confirmed,
            EXISTS (SELECT 1 FROM matches m WHERE m.club_code = c.code) AS drawn
     FROM clubs c ORDER BY c.grp, c.sort`,
  );
  const club = (searchParams.club || clubs[0]?.code || '').toUpperCase();
  const selected = clubs.find((c) => c.code === club);

  const matches = selected
    ? await query<{ id: string; round: string; slot: number; player_a: string | null; player_b: string | null; score_a: number | null; score_b: number | null; winner: string | null }>(
        `SELECT id, round, slot, player_a, player_b, score_a, score_b, winner
         FROM matches WHERE club_code = $1 ORDER BY round, slot`,
        [club],
      )
    : [];
  const byRound = ROUND_ORDER
    .map((r) => ({ round: r, items: matches.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot) }))
    .filter((g) => g.items.length);
  const finalMatch = matches.find((m) => m.round === 'FINAL');
  const champion = finalMatch?.winner ? (finalMatch.winner === 'a' ? finalMatch.player_a : finalMatch.player_b) : null;
  const anyResult = matches.some((m) => m.score_a !== null);

  return (
    <>
      <h1 className="page-title">Draw &amp; results</h1>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {clubs.map((c) => (
          <Link key={c.code} href={`/draw?club=${c.code}`} className="mono"
            style={{ padding: '7px 11px', fontSize: 11, letterSpacing: '.08em',
              border: '1px solid ' + (c.code === club ? 'var(--accent)' : 'var(--line-2)'),
              color: c.code === club ? 'var(--accent-glow)' : c.drawn ? 'var(--ok)' : 'var(--ink-3)',
              background: c.code === club ? 'rgba(200,162,78,0.1)' : 'var(--bg-1)' }}>
            {c.code}{c.drawn ? ' ✓' : ''}
          </Link>
        ))}
      </div>

      {selected && (
        <>
          <div className="notice" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              <strong>{selected.name}</strong>
              <span className="mono" style={{ marginLeft: 12, fontSize: 11, color: 'var(--ink-3)' }}>
                GROUP {selected.grp} · {selected.confirmed} CONFIRMED {selected.drawn ? `· ${matches.length} MATCHES DRAWN` : '· NOT DRAWN'}
              </span>
              {champion && <span className="pill gold" style={{ marginLeft: 12 }}>CHAMPION · {champion}</span>}
            </div>
            <DrawControls clubCode={club} drawn={selected.drawn} anyResult={anyResult} confirmed={selected.confirmed} />
          </div>

          {selected.grp === 'A' && !selected.drawn && (
            <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '.06em', marginTop: -8, marginBottom: 20 }}>
              Generating a draw does NOT close Group A registration — closing is the GROUP_A_CLOSED flag in the main
              site&apos;s src/data/static.ts, deployed together with the draw announcement.
            </p>
          )}

          <div style={{ display: 'flex', gap: 22, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: 12 }}>
            {byRound.map((g) => (
              <div key={g.round} style={{ minWidth: 300 }}>
                <div className="marker" style={{ marginBottom: 10 }}>{ROUND_LABEL[g.round]}</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {g.items.map((m) => (
                    <div key={m.id} style={{ border: '1px solid var(--line-2)', background: 'var(--bg-1)', padding: '10px 12px' }}>
                      <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '.14em', marginBottom: 6 }}>MATCH {m.slot + 1}</div>
                      {[['a', m.player_a, m.score_a] as const, ['b', m.player_b, m.score_b] as const].map(([side, name, score]) => (
                        <div key={side} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '3px 0',
                          color: m.winner === side ? 'var(--accent-glow)' : name ? 'var(--ink)' : 'var(--ink-4)',
                          fontWeight: m.winner === side ? 600 : 400 }}>
                          <span className="mono" style={{ fontSize: 13 }}>{name || (m.winner && !name ? 'BYE' : 'TBD')}</span>
                          <span className="mono" style={{ fontSize: 13 }}>{score ?? ''}</span>
                        </div>
                      ))}
                      {m.player_a && m.player_b && (
                        <ResultForm matchId={m.id} hasResult={m.score_a !== null} />
                      )}
                      {m.winner && !m.player_b && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>bye — advanced automatically</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {byRound.length === 0 && (
              <div className="notice" style={{ minWidth: 380 }}>
                No bracket yet. Confirm this club&apos;s entries on the Registrations tab, then generate the draw.
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
