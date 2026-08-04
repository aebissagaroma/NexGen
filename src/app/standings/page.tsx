'use client';
// League table — reads standings from the DB (empty until the season starts).
import * as React from 'react';
import Link from 'next/link';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { PageFooter } from '@/components/SiteNotices';

interface Row { club_code: string; club_name: string; player_tag: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number; }

export default function StandingsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch('/api/standings').then((r) => r.json()).then((d) => { setRows(d.standings || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader />
      <div className="page-wrap">
        <PageTitle file="FILE/06 · TABLE" title={<>LEAGUE<br /><span style={{ color: 'var(--accent-glow)' }}>TABLE.</span></>} sub="38 gameweeks, round-robin. The table populates once the season kicks off; the date is announced after Draft Day." />
        {loading ? (
          <div className="mono" style={{ color: 'var(--ink-3)', letterSpacing: '.18em', fontSize: 12 }}>LOADING…</div>
        ) : rows.length === 0 ? (
          <div className="ticks" style={{ position: 'relative', border: '1px solid var(--line-2)', minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 40, background: 'var(--bg-1)' }}>
            <span className="tk1" /><span className="tk2" />
            <span className="mono" style={{ fontSize: 10, letterSpacing: '.26em', color: 'var(--accent-glow)' }}>SEASON NOT STARTED</span>
            <div className="display" style={{ fontSize: 'clamp(28px,4vw,48px)' }}>KICKOFF · DATE TBA</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--line-2)', borderRadius: 4 }}>
            <table className="data-table">
              <thead><tr><th>#</th><th>Player</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.player_tag}>
                    <td className="mono">{i + 1}</td>
                    <td><Link href={`/players/${encodeURIComponent(r.player_tag)}`} style={{ color: 'var(--ink)' }}>{r.player_tag}</Link></td>
                    <td className="mono" style={{ color: 'var(--ink-3)' }}>{r.club_code}</td>
                    <td className="num">{r.played}</td><td className="num">{r.won}</td><td className="num">{r.drawn}</td><td className="num">{r.lost}</td>
                    <td className="num">{r.gf}</td><td className="num">{r.ga}</td><td className="num">{r.gd}</td>
                    <td className="num" style={{ color: 'var(--accent-glow)', fontWeight: 700 }}>{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PageFooter />
    </>
  );
}
