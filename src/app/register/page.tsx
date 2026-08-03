'use client';
// Registration flow: email → OTP → details → confirmation.
import * as React from 'react';
import { Css } from '@/components/Css';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader, PageTitle } from '@/components/PageHeader';
import { CLUBS } from '@/data/static';
import { AppealForm } from '@/components/AppealForm';
import { IdUpload } from '@/components/IdUpload';

type Step = 'email' | 'otp' | 'details' | 'done';

// An entry the player already has. One per player, so at most one of these.
type Existing = { club_name: string; full_name: string; gamertag: string | null; id_last4: string | null; status: string; id_doc_status: string | null; id_doc_type: string | null };

function RegisterInner() {
  const params = useSearchParams();
  const preClub = params.get('club') || '';
  const [step, setStep] = React.useState<Step>('email');
  const [email, setEmail] = React.useState('');
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirmName, setConfirmName] = React.useState('');
  const [existing, setExisting] = React.useState<Existing | null>(null);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tag, setTag] = React.useState('');
  const [tagsBusy, setTagsBusy] = React.useState(false);

  // A verified player gets one entry, so there is no point rendering the details
  // form to someone who already has one — the API would only reject it.
  async function loadExisting(): Promise<boolean> {
    const res = await fetch('/api/register');
    if (!res.ok) return false;
    const data = await res.json();
    const found = data.registrations?.[0];
    if (found) setExisting(found);
    return Boolean(found);
  }

  // Returning players often still hold a valid session cookie from a past visit,
  // so check before asking them to sit through the OTP again.
  React.useEffect(() => { void loadExisting(); }, []);

  // Set when the register-intent request reports this address already holds an
  // entry — decided BEFORE any code is emailed, so returning players don't cost
  // a send just to be told they're in. Cleared by "use a different email".
  const [knownRegistered, setKnownRegistered] = React.useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const res = await fetch('/api/auth/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, intent: 'register' }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setErr(data.error); return; }
    if (data.alreadyRegistered) { setEmail(data.email); setKnownRegistered(true); return; }
    setEmail(data.email); setDevCode(data.devCode); setStep('otp');
  }

  // Sub-flow inside the already-registered notice: password sign-in (free —
  // no email sent), with an OTP-backed reset as the forgot-password path.
  const [authMode, setAuthMode] = React.useState<'password' | 'reset'>('password');
  const [pw, setPw] = React.useState('');

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setErr(data.error); return; }
    await loadExisting(); // sets `existing` → renders the entry card
  }

  // Forgot password: the one returning-player path that still costs an email.
  async function forgotPassword() {
    setBusy(true); setErr(null);
    const res = await fetch('/api/auth/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setErr(data.error); return; }
    setDevCode(data.devCode); setAuthMode('reset');
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const fd = new FormData(e.target as HTMLFormElement);
    const res = await fetch('/api/auth/password/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: fd.get('code'), newPassword: fd.get('newPassword') }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setErr(data.error); return; }
    await loadExisting();
  }
  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const fd = new FormData(e.target as HTMLFormElement);
    const res = await fetch('/api/auth/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: fd.get('code') }) });
    const data = await res.json();
    if (!res.ok) { setBusy(false); setErr(data.error); return; }
    const already = await loadExisting();
    setBusy(false);
    if (!already) setStep('details');
  }
  // Gamertags are offered, not typed: the player picks one built from the name
  // they just entered. Refetched whenever the name changes, because suggestions
  // derived from a stale name would be confusing.
  async function loadTags(name: string) {
    const trimmed = name.trim();
    if (trimmed.length < 2) { setTags([]); setTag(''); return; }
    setTagsBusy(true);
    try {
      const res = await fetch('/api/tags/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: trimmed }),
      });
      const data = await res.json();
      const opts: string[] = data.options || [];
      setTags(opts);
      // Keep their pick only if it is still on offer.
      setTag((cur) => (opts.includes(cur) ? cur : opts[0] || ''));
    } catch {
      setTags([]);
    } finally {
      setTagsBusy(false);
    }
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    const fd = new FormData(e.target as HTMLFormElement);
    if (fd.get('password') !== fd.get('passwordConfirm')) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: fd.get('fullName'), idNumber: fd.get('idNumber'), clubCode: fd.get('clubCode'), city: fd.get('city'), gamertag: tag, password: fd.get('password') }) });
    const data = await res.json();
    if (!res.ok) {
      // 409 = they already hold an entry (a duplicate submit, or an alias of an
      // address that is already in). Show the entry itself rather than an error
      // above a form they cannot submit.
      if (res.status === 409) await loadExisting();
      setBusy(false); setErr(data.error); return;
    }
    setBusy(false);
    setConfirmName(String(fd.get('fullName') || '')); setStep('done');
  }

  return (
    <>
      <PageHeader />
      <div className="page-wrap" style={{ maxWidth: 720 }}>
        <PageTitle file="ENTER · QUALIFIER" title={<>REGISTER<br /><span style={{ color: 'var(--accent-glow)' }}>YOUR RUN.</span></>} sub="Verify your email, then enter the club bracket you want to represent. One entry per player — you represent a single club." />

        {!existing && <Steps step={step} />}

        <div className="form-card" style={{ marginTop: 28 }}>
          {existing && <AlreadyEntered reg={existing} />}
          {!existing && knownRegistered && authMode === 'password' && (
            <form onSubmit={signIn} style={{ display: 'grid', gap: 18 }}>
              <div className="notice notice-ok">
                <strong>{email}</strong> already has an entry — one entry per player.
                Sign in with your password to view your registration, or use a different email if you&apos;re a different player.
              </div>
              <div><label className="label">Password</label><input className="field" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" required autoFocus /></div>
              {err && <div className="notice notice-err">{err}</div>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn" disabled={busy}>{busy ? 'SIGNING IN…' : 'SIGN IN →'}</button>
                <button type="button" className="btn-ghost" onClick={forgotPassword} disabled={busy}>FORGOT PASSWORD?</button>
                <button type="button" className="btn-ghost" onClick={() => { setKnownRegistered(false); setEmail(''); setPw(''); setErr(null); }}>USE A DIFFERENT EMAIL</button>
              </div>
              <p className="mono" style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)' }}>Forgot password emails you a 6-digit code to set a new one.</p>
            </form>
          )}
          {!existing && knownRegistered && authMode === 'reset' && (
            <form onSubmit={resetPassword} style={{ display: 'grid', gap: 18 }}>
              {devCode && <div className="notice notice-ok">Dev mode — your code is <strong>{devCode}</strong> (no email sent locally).</div>}
              <div><label className="label">6-digit code sent to {email}</label><input className="field" name="code" inputMode="numeric" maxLength={6} placeholder="••••••" required autoFocus style={{ letterSpacing: '.4em', fontFamily: 'var(--f-mono)' }} /></div>
              <div><label className="label">New password (min 8 characters)</label><input className="field" name="newPassword" type="password" minLength={8} placeholder="••••••••" required /></div>
              {err && <div className="notice notice-err">{err}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn" disabled={busy}>{busy ? 'SETTING…' : 'SET PASSWORD & SIGN IN →'}</button>
                <button type="button" className="btn-ghost" onClick={() => { setAuthMode('password'); setErr(null); }}>BACK</button>
              </div>
            </form>
          )}
          {!existing && !knownRegistered && step === 'email' && (
            <form onSubmit={requestOtp} style={{ display: 'grid', gap: 18 }}>
              <div><label className="label">Email address</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
              {err && <div className="notice notice-err">{err}</div>}
              <button className="btn" disabled={busy}>{busy ? 'SENDING…' : 'SEND CODE →'}</button>
              <p className="mono" style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)' }}>We&apos;ll email you a 6-digit verification code.</p>
            </form>
          )}
          {!existing && step === 'otp' && (
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
          {!existing && step === 'details' && (
            <form onSubmit={submitDetails} style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="reg-grid">
                <div><label className="label">Full name</label><input className="field" name="fullName" required placeholder="Your legal name, as on your ID" onBlur={(e) => loadTags(e.target.value)} /></div>
                <div><label className="label">ID number</label><input className="field" name="idNumber" required placeholder="Fayda, Kebele ID or passport" autoComplete="off" spellCheck={false} /></div>
                <div><label className="label">Club to represent</label>
                  <select className="field" name="clubCode" defaultValue={preClub} required>
                    <option value="" disabled>Select a club…</option>
                    {CLUBS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label">City (optional)</label><input className="field" name="city" placeholder="Addis Ababa" /></div>
                <div><label className="label">Create password (min 8 characters)</label><input className="field" name="password" type="password" minLength={8} required placeholder="••••••••" /></div>
                <div><label className="label">Confirm password</label><input className="field" name="passwordConfirm" type="password" minLength={8} required placeholder="••••••••" /></div>
              </div>
              <p className="mono" style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)' }}>You&apos;ll sign in with your email and this password — no more codes.</p>
              <div>
                <label className="label">Pick your gamertag</label>
                <p className="mono" style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)', margin: '0 0 10px' }}>
                  Built from your name — this is how you appear on brackets and broadcast.
                </p>
                {tagsBusy && <div className="mono" style={{ fontSize: 11, letterSpacing: '.14em', color: 'var(--ink-3)' }}>FINDING OPTIONS…</div>}
                {!tagsBusy && tags.length === 0 && (
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--ink-3)' }}>
                    Enter your full name above and we&apos;ll suggest some.
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      aria-pressed={tag === t}
                      className="mono"
                      style={{
                        padding: '9px 14px', fontSize: 12, letterSpacing: '.1em', cursor: 'pointer',
                        border: '1px solid ' + (tag === t ? 'var(--accent)' : 'var(--line-2)'),
                        background: tag === t ? 'rgba(var(--accent-rgb),0.12)' : 'var(--bg-1)',
                        color: tag === t ? 'var(--accent-glow)' : 'var(--ink-2)',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mono" style={{ fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-4)', lineHeight: 1.6, margin: 0 }}>
                Your ID confirms your age and keeps entries to one per player. We store only a scrambled
                version of the number and its last 4 digits — never the number itself. Bring the same ID to
                your Qualifier Center. No console or game needed.
              </p>
              {/* TODO(dev): add remaining fields per src/types RegistrationInput
                  (date of birth, jersey name, rules acceptance) once confirmed. */}
              <div className="notice" style={{ borderColor: 'rgba(var(--accent-glow-rgb),0.35)', background: 'rgba(var(--accent-rgb),0.06)' }}>
                <strong>One entry per player.</strong> Submitting a second entry — under another email, ID or
                name — means <strong>immediate disqualification</strong>. Blocked by mistake? There is an appeal
                below.
              </div>
              {err && <div className="notice notice-err">{err}</div>}
              <button className="btn" disabled={busy}>{busy ? 'SUBMITTING…' : 'SUBMIT ENTRY →'}</button>
              {/* Only after a rejection: offering an appeal to someone who has not
                  been blocked would just be noise. */}
              {err && <AppealForm defaultEmail={email} />}
              <Css>{`@media (max-width:560px){.reg-grid{grid-template-columns:1fr!important}}`}</Css>
            </form>
          )}
          {!existing && step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="display" style={{ fontSize: 'clamp(36px,6vw,64px)', color: 'var(--accent-glow)', lineHeight: 0.95 }}>YOU&apos;RE IN.</div>
              <p style={{ color: 'var(--ink-2)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '44ch', margin: '18px auto 0' }}>
                Thanks{confirmName ? `, ${confirmName.split(' ')[0]}` : ''} — your entry is logged. We&apos;ll email you bracket seeding and match details ahead of the live draw, and announce the date once registration closes.
              </p>
              {/* Upload comes AFTER the entry is saved, so a failed or slow
                  upload can never cost someone their place. */}
              <div style={{ textAlign: 'left' }}><IdUpload /></div>
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

// Shown instead of the form when the player already holds an entry.
function AlreadyEntered({ reg }: { reg: Existing }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div className="display" style={{ fontSize: 'clamp(30px,5vw,52px)', color: 'var(--accent-glow)', lineHeight: 0.95 }}>ALREADY IN.</div>
      <p style={{ color: 'var(--ink-2)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '44ch', margin: '18px auto 0' }}>
        You are entered as <strong style={{ color: 'var(--ink)' }}>{reg.gamertag || reg.full_name}</strong> representing <strong style={{ color: 'var(--ink)' }}>{reg.club_name}</strong>{reg.id_last4 ? <>, on the ID ending <strong style={{ color: 'var(--ink)' }}>{reg.id_last4}</strong></> : null}. It is one entry per player, so there is nothing more to submit.
      </p>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em', color: 'var(--ink-4)', marginTop: 16 }}>
        STATUS · {String(reg.status).toUpperCase()}
      </div>
      <p style={{ color: 'var(--ink-3)', fontSize: 13.5, lineHeight: 1.6, maxWidth: '44ch', margin: '18px auto 0' }}>
        Do not submit a second entry — that means immediate disqualification. Need to switch club or fix a
        detail? Reply to your verification email and NexGen ops will sort it.
      </p>
      {/* Still open for anyone who has not sent a document yet, including players
          who asked to use a Kebele or other ID instead of a Fayda. */}
      <div style={{ textAlign: 'left' }}>
        <IdUpload initialStatus={reg.id_doc_status} initialType={reg.id_doc_type} />
        <AppealForm />
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/bracket" className="btn">VIEW BRACKETS →</Link>
        <Link href="/" className="btn-ghost">BACK HOME</Link>
      </div>
    </div>
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
