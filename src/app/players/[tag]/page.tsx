'use client';
// Player profile — registration + standing + matches for a player.
import * as React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader, PageTitle } from '@/components/PageHeader';

export default function PlayerPage() {
  const params = useParams<{ tag: string }>();
  const tag = decodeURIComponent(params.tag);
  const [data, setData] = React.useState<any>(null);
  const [state, setState] = React.useState<'loading' | 'ok' | 'missing'>('loading');

  React.useEffect(() => {
    fetch(`/api/players/${encodeURIComponent(tag)}`).then(async (r) => {
      if (!r.ok) { setState('missing'); return; }
      setData(await r.json()); setState('ok');
    }).catch(() => setState('missing'));
  }, [tag]);

  return (
    <>
      <PageHeader />
      <div className="page-wrap" style={{ maxWidth: 900 }}>
        {state === 'loading' && <div className="mono" style={{ color: 'var(--ink-3)', letterSpacing: '.18em', fontSize: 12 }}>LOADING…</div>}
        {state === 'missing' && (
          <div>
            <PageTitle file="PLAYER" title="PLAYER NOT FOUND" sub={`No registered player matches “${tag}”.`} />
          </div>
        )}
        {state === 'ok' && data && (
          <>
            <PageTitle file={`PLAYER · ${data.player.club_code}`} title={<span style={{ color: 'var(--accent-glow)' }}>{data.player.gamertag}</span>} sub={`${data.player.full_name} · ${data.player.club_name}${data.player.city ? ' · ' + data.player.city : ''}`} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 40 }}>
              {statCells(data.standing).map((s) => (
                <div key={s.k} style={{ background: 'var(--bg-1)', padding: 20 }}>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.2em', color: 'var(--ink-3)' }}>{s.k}</div>
                  <div className="display num" style={{ fontSize: 34, marginTop: 6, color: s.accent ? 'var(--accent-glow)' : 'var(--ink)' }}>{s.v}</div>
                </div>
              ))}
            </div>
            {data.matches?.length > 0 && (
              <div style={{ border: '1px solid var(--line-2)', borderRadius: 4, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead><tr><th>Round</th><th>Home</th><th>Score</th><th>Away</th></tr></thead>
                  <tbody>
                    {data.matches.map((m: any, i: number) => (
                      <tr key={i}><td className="mono">{m.round}</td><td>{m.player_a}</td><td className="num">{m.score_a ?? '–'} : {m.score_b ?? '–'}</td><td>{m.player_b}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function statCells(s: any) {
  if (!s) return [{ k: 'STATUS', v: 'PRE-SEASON', accent: true }];
  return [
    { k: 'PLAYED', v: s.played }, { k: 'WON', v: s.won }, { k: 'DRAWN', v: s.drawn }, { k: 'LOST', v: s.lost },
    { k: 'GD', v: s.gd }, { k: 'POINTS', v: s.points, accent: true },
  ];
}
