'use client';
// Upload a photo of an identity document.
//
// Used after registering: with a Fayda, or with a Kebele/other ID by players who
// asked to submit an alternative. Kept separate from the registration submit so a
// failed or slow upload can never cost someone their entry — the entry is already
// saved by the time this runs.
import * as React from 'react';

const LABELS: Record<string, string> = {
  fayda: 'Fayda national ID',
  kebele: 'Kebele ID',
  other: 'Other government ID',
};

export function IdUpload({
  initialStatus,
  initialType,
  onDone,
}: {
  initialStatus?: string | null;
  initialType?: string | null;
  onDone?: () => void;
}) {
  const [status, setStatus] = React.useState(initialStatus || 'pending');
  const [docType, setDocType] = React.useState(initialType || 'fayda');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const form = e.currentTarget;
    const fd = new FormData();
    const input = form.elements.namedItem('file') as HTMLInputElement | null;
    if (!input?.files?.[0]) { setErr('Choose a photo first.'); setBusy(false); return; }
    fd.append('file', input.files[0]);
    fd.append('docType', docType);
    try {
      const res = await fetch('/api/register/id-doc', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setStatus('provided'); onDone?.(); return; }
      setErr(data.error || 'Upload failed. Try again.');
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'provided') {
    return (
      <div role="status" style={{ marginTop: 20, padding: '14px 18px', border: '1px solid rgba(var(--accent-glow-rgb),0.35)', background: 'rgba(var(--accent-rgb),0.06)' }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--accent-glow)' }}>
          ID RECEIVED · {(LABELS[docType] || docType).toUpperCase()}
        </span>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          Staff will check it against the ID you bring to your Qualifier Center.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 20, display: 'grid', gap: 12, padding: '18px', border: '1px dashed var(--line-2)', background: 'var(--bg-1)' }}>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.18em', color: 'var(--accent-glow)' }}>ID PHOTO REQUIRED</div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
        Upload a clear photo of your <strong style={{ color: 'var(--ink)' }}>Fayda national ID</strong>.
        No Fayda? Choose another document below and upload that instead — your entry is already saved either way.
      </p>
      <div>
        <label className="label">Document</label>
        <select className="field" value={docType} onChange={(e) => setDocType(e.target.value)}>
          <option value="fayda">Fayda national ID</option>
          <option value="kebele">Kebele ID</option>
          <option value="other">Other government ID</option>
        </select>
      </div>
      <div>
        <label className="label">Photo</label>
        <input className="field" type="file" name="file" accept="image/*,application/pdf" required style={{ height: 'auto', padding: 10 }} />
      </div>
      {err && <div className="notice notice-err">{err}</div>}
      <button className="btn" disabled={busy}>{busy ? 'UPLOADING…' : 'UPLOAD ID →'}</button>
      <p className="mono" style={{ fontSize: 10, letterSpacing: '.06em', color: 'var(--ink-4)', margin: 0, lineHeight: 1.6 }}>
        Only NexGen staff can see it. Max 8 MB — a phone photo is fine.
      </p>
    </form>
  );
}
