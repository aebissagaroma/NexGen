'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';

export function DrawControls({ clubCode, drawn, anyResult, confirmed }: {
  clubCode: string; drawn: boolean; anyResult: boolean; confirmed: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function call(method: 'POST' | 'DELETE') {
    setBusy(true); setErr(null);
    const res = await fetch('/api/draw', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clubCode }) });
    setBusy(false);
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error || 'Failed.'); return; }
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      {err && <span className="mono" style={{ fontSize: 11, color: 'var(--err)' }}>{err}</span>}
      {!drawn && (
        <button className="btn" disabled={busy || confirmed < 2}
          onClick={() => { if (confirm(`Generate the ${clubCode} draw from ${confirmed} confirmed entries? The bracket appears on the public site immediately.`)) call('POST'); }}>
          {busy ? 'DRAWING…' : `GENERATE DRAW (${confirmed})`}
        </button>
      )}
      {drawn && !anyResult && (
        <button className="btn-danger" disabled={busy}
          onClick={() => { if (confirm(`Clear the ${clubCode} bracket? Possible only because no result has been recorded.`)) call('DELETE'); }}>
          CLEAR BRACKET
        </button>
      )}
    </div>
  );
}

export function ResultForm({ matchId, hasResult }: { matchId: string; hasResult: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  if (!open) {
    return (
      <button className="btn-ghost" style={{ padding: '4px 10px', marginTop: 6, fontSize: 10 }} onClick={() => setOpen(true)}>
        {hasResult ? 'CORRECT RESULT' : 'ENTER RESULT'}
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const fd = new FormData(e.target as HTMLFormElement);
    const res = await fetch('/api/results', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, scoreA: Number(fd.get('a')), scoreB: Number(fd.get('b')) }),
    });
    setBusy(false);
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error || 'Failed.'); return; }
    setOpen(false); router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <input className="field" name="a" type="number" min={0} max={99} required placeholder="A" style={{ width: 56, padding: '5px 8px' }} />
      <span className="mono" style={{ color: 'var(--ink-4)' }}>–</span>
      <input className="field" name="b" type="number" min={0} max={99} required placeholder="B" style={{ width: 56, padding: '5px 8px' }} />
      <button className="btn" style={{ padding: '6px 10px', fontSize: 10 }} disabled={busy}>SAVE</button>
      <button type="button" className="btn-ghost" style={{ padding: '6px 10px', fontSize: 10 }} onClick={() => { setOpen(false); setErr(null); }}>✕</button>
      {err && <span className="mono" style={{ fontSize: 10.5, color: 'var(--err)', flexBasis: '100%' }}>{err}</span>}
    </form>
  );
}
