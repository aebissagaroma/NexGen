'use client';
// Small mutation controls shared by the tabs. Each PATCHes its endpoint and
// refreshes the server-rendered page, so the table around it stays the single
// source of truth.
import { useRouter } from 'next/navigation';
import * as React from 'react';

export function InlineSelect({ endpoint, id, field, value, options }: {
  endpoint: string; id: string; field: string; value: string; options: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <select
      className="field" style={{ height: 32, fontSize: 12, padding: '4px 8px', minWidth: 112 }} value={value} disabled={busy}
      onChange={async (e) => {
        setBusy(true);
        await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, [field]: e.target.value }) });
        setBusy(false); router.refresh();
      }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function HandledToggle({ endpoint, id, handled }: { endpoint: string; id: string; handled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      className={handled ? 'btn-ghost' : 'btn'} style={{ padding: '6px 12px' }} disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, handled: !handled }) });
        setBusy(false); router.refresh();
      }}
    >
      {handled ? 'REOPEN' : 'MARK HANDLED'}
    </button>
  );
}
