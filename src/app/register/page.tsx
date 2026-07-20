'use client';
// Registration flow: email → OTP → details → confirmation.
import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { CLUBS } from '@/data/static';

type Step = 'email' | 'otp' | 'details' | 'done';

function RegisterInner() {
  const params = useSearchParams();
  const preClub = params.get('club') || '';
  const [step, setStep] = React.useState<Step>('email');
  const [email, setEmail] = React.useState('');
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirmName, setConfirmName] = React.useState('');

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const res = await fetch('/api/auth/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setErr(data.error); return; }
    setEmail(data.email); setDevCode(data.devCode); setStep('otp');
  }
  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const fd = new FormData(e.target as HTMLFormElement);
    const res = await fetch('/api/auth/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: fd.get('code') }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setErr(data.error); return; }
    setStep('details');
  }
  async function submitDetails(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const fd = new FormData(e.target as HTMLFormElement);
    const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: fd.get('fullName'), gamertag: fd.get('gamertag'), clubCode: fd.get('clubCode'), platform: fd.get('platform'), city: fd.get('city') }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setErr(data.error); return; }
    setConfirmName(String(fd.get('fullName') || '')); setStep('done');
  }

  return (
    <>
      <PageHeader />
      <div className="page-wrap" style={{ maxWidth: 720 }}>
        <PageTitle file="ENTER · QUALIFIER" title={<>REGISTER<br /><span style={{ color: 'var(--accent-glow)' }}>YOUR RUN.</span></>} sub="Verify your email, then enter the club bracket you want to represent. One entry per email per club." />

        <Steps step={step} />

        <div className="form-card" style={{ marginTop: 28 }}>
          {step === 'email' && (
            <form onSubmit={requestOtp} style={{ display: 'grid', gap: 18 }}>
              <div><label className="label">Email address</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
              {err && <div className="notice notice-err">{err}</div>}
              <button className="btn" disabled={busy}>{busy ? 'SENDING…' : 'SEND CODE →'}</button>
              <p className="mono" style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)' }}>We&apos;ll email you a 6-digit verification code.</p>
            </form>
          )}
          {step === 'otp' && (
            <form onSubmit={verifyOtp} style={{ display: 'grid', gap: 18 }}>
              {devCode && <div className="notice notice-ok">Dev mode — your code is <strong>{devCode}</strong> (no email sent locally).</div>}
              <div><label className="label">6-digit code sent to {email}</label><input className="field" name="code" inputMode="numeric" maxLength={6} placeholder="••••••" required style={{ letterSpacing: '.4em', fontFamily: 'var(--f-mono)' }} /></div>
              {err && <div className="notice notice-err">{err}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn" disabled={busy}>{busy ? 'VERIFYING…' : 'VERIFY →'}</button>
                <button type="button" className="btn-ghost" onClick={() => setStep('email')}>CHANGE EMAIL</button>
              </div>
            </form>
          )}
          {step === 'details' && (
            <form onSubmit={submitDetails} style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="reg-grid">
                <div><label className="label">Full name</label><input className="field" name="fullName" required placeholder="Your legal name" /></div>
                <div><label className="label">Gamertag</label><input className="field" name="gamertag" required placeholder="In-game name" /></div>
                <div><label className="label">Club to represent</label>
                  <select className="field" name="clubCode" defaultValue={preClub} required>
                    <option value="" disabled>Select a club…</option>
                    {CLUBS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Platform</label>
                  <select className="field" name="platform" defaultValue="PS5"><option>PS5</option><option>PC</option><option>XBOX</option></select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}><label className="label">City (optional)</label><input className="field" name="city" placeholder="Addis Ababa" /></div>
              </div>
              {/* TODO(dev): add remaining fields per src/types RegistrationInput
                  (date of birth, EA/PSN id, jersey name, rules acceptance) once confirmed. */}
              {err && <div className="notice notice-err">{err}</div>}
              <button className="btn" disabled={busy}>{busy ? 'SUBMITTING…' : 'SUBMIT ENTRY →'}</button>
              <style>{`@media (max-width:560px){.reg-grid{grid-template-columns:1fr!important}}`}</style>
            </form>
          )}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="display" style={{ fontSize: 'clamp(36px,6vw,64px)', color: 'var(--accent-glow)', lineHeight: 0.95 }}>YOU&apos;RE IN.</div>
              <p style={{ color: 'var(--ink-2)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '44ch', margin: '18px auto 0' }}>
                Thanks{confirmName ? `, ${confirmName.split(' ')[0]}` : ''} — your entry is logged. You&apos;ll get bracket seeding and match details before the live draw on <strong style={{ color: 'var(--ink)' }}>05 July 2026</strong>.
              </p>
              <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/bracket" className="btn">VIEW BRACKETS →</Link>
                <Link href="/" className="btn-ghost">BACK HOME</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Steps({ step }: { step: Step }) {
  const order: Step[] = ['email', 'otp', 'details', 'done'];
  const labels = { email: 'EMAIL', otp: 'VERIFY', details: 'DETAILS', done: 'DONE' };
  const idx = order.indexOf(step);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
      {order.map((s, i) => (
        <div key={s} style={{ padding: '10px 12px', border: '1px solid var(--line-2)', background: i <= idx ? 'rgba(var(--accent-rgb),0.08)' : 'var(--bg-1)' }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.18em', color: i <= idx ? 'var(--accent-glow)' : 'var(--ink-4)' }}>{String(i + 1).padStart(2, '0')}</div>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.1em', color: i <= idx ? 'var(--ink)' : 'var(--ink-3)', marginTop: 4 }}>{labels[s]}</div>
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  // useSearchParams must be inside Suspense in the app router.
  return (
    <React.Suspense fallback={null}>
      <RegisterInner />
    </React.Suspense>
  );
}
