import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';
import { str } from '@/lib/validation';
import { hashPassword } from '@/lib/password';
import { notifyOps, notifyEachRegistration, sendMail } from '@/lib/mailer';
import { parseDob, checkAge, MIN_AGE, GUARDIAN_NOTICE } from '@/lib/age';
import { registrationPhase, REGISTRATION_OPENS_TIME, REGISTRATION_CLOSES_LABEL } from '@/data/static';
import { isPlausiblePhone } from '@/lib/phone';
import { canonicalId, hashId, idLast4 } from '@/lib/national-id';
import { rateLimit, peekCount, clientIp } from '@/lib/rate-limit';
import { verifyChallenge, isChallengeConfigured, CHALLENGE_AFTER_FAILURES } from '@/lib/challenge';

// Enumeration guard. The form tells someone when an ID is already registered,
// which is necessary — an entrant who mistyped needs to know — but it also means
// a script could test ID numbers one at a time. Two windows: a short one that
// stops a burst, and an hourly one that stops a slow drip under it.
const ATTEMPTS_PER_10_MIN = 5;
const ATTEMPTS_PER_HOUR = 20;
const FAILURE_WINDOW_SEC = 60 * 60;

/** Rejected attempts from this IP in the last hour. Does not count as an attempt. */
function failureCount(ip: string): Promise<number> {
  return peekCount(`reg:fail:${ip}`, FAILURE_WINDOW_SEC);
}

/**
 * Record a rejected attempt and return the response.
 *
 * Only rejections that could be probing are counted — a wrong ID or a duplicate.
 * Being told to accept the rules is not an enumeration signal and must not push
 * a genuine entrant towards a challenge.
 */
async function rejected(ip: string, status: number, error: string) {
  await rateLimit(`reg:fail:${ip}`, Number.MAX_SAFE_INTEGER, FAILURE_WINDOW_SEC);
  return NextResponse.json({ error }, { status });
}

// POST /api/register — create a qualifier registration for the logged-in player.
// Requires a verified email session (see /api/auth/otp/verify).
export async function POST(req: Request) {
  const session = getSession('user');
  if (!session) {
    return NextResponse.json({ error: 'Verify your email first.' }, { status: 401 });
  }

  // The window is enforced here, not only by the disabled buttons: those are a
  // courtesy, and a hand-made POST would otherwise take an entry before sign-ups
  // open or after they close.
  const phase = registrationPhase();
  if (phase !== 'open') {
    return NextResponse.json(
      {
        error: phase === 'before'
          ? `Registration opens ${REGISTRATION_OPENS_TIME}.`
          : `Registration closed on ${REGISTRATION_CLOSES_LABEL}.`,
      },
      { status: 403 },
    );
  }

  // Counted per IP before anything is parsed, so a malformed body still costs an
  // attempt and cannot be used to probe for free.
  const ip = clientIp(req);
  const burst = await rateLimit(`reg:ip:10m:${ip}`, ATTEMPTS_PER_10_MIN, 10 * 60);
  const hourly = await rateLimit(`reg:ip:1h:${ip}`, ATTEMPTS_PER_HOUR, 60 * 60);
  if (!burst.ok || !hourly.ok) {
    const retryAfter = !burst.ok ? burst.retryAfter : hourly.retryAfter;
    // Logged without the submitted value — the point of the limit is defeated if
    // the candidate IDs end up in the log instead of the database.
    console.warn(`[register] rate limited ip=${ip} window=${!burst.ok ? '10m' : '1h'}`);
    return NextResponse.json(
      { error: 'Too many attempts from this connection. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));

  // A challenge is demanded only after repeated rejections from this IP, so a
  // first-time entrant never sees one and a prober cannot continue without
  // solving it. `failures` counts rejected attempts, not requests.
  const failures = await failureCount(ip);
  const challengeRequired = isChallengeConfigured() && failures >= CHALLENGE_AFTER_FAILURES;
  if (challengeRequired && !(await verifyChallenge((body as { challengeToken?: unknown }).challengeToken, ip))) {
    console.warn(`[register] challenge failed or missing ip=${ip} failures=${failures}`);
    return NextResponse.json(
      { error: 'Please complete the verification and try again.', challengeRequired: true },
      { status: 403 },
    );
  }
  const fullName = str(body.fullName, { min: 2, max: 120 });
  const clubCode = str(body.clubCode, { min: 2, max: 4 });
  const password = str(body.password, { min: 8, max: 200 });
  const city = body.city ? str(body.city, { max: 80 }) : null;
  const phone = str(body.phone, { min: 7, max: 30 });
  const dob = parseDob(body.dateOfBirth);
  const acceptedTerms = body.acceptedTerms === true;
  // The raw number is used here and then discarded — only an irreversible hash
  // and the last four characters are stored. See src/lib/national-id.ts.
  const idCanon = canonicalId(body.idNumber);
  // Chosen from the name-derived options offered by /api/tags/suggest. Not
  // re-derived here on purpose: the player may have picked one, then edited their
  // name slightly, and rejecting their choice for that would be baffling. It only
  // has to be a sane, unused handle.
  const gamertag = str(body.gamertag, { min: 3, max: 20 });

  if (!fullName || !clubCode) {
    return NextResponse.json({ error: 'Name and club are required.' }, { status: 400 });
  }
  if (!phone || !isPlausiblePhone(phone)) {
    return NextResponse.json({ error: 'Enter a phone number we can reach you on.' }, { status: 400 });
  }
  if (!dob) {
    return NextResponse.json({ error: 'Enter your date of birth as it appears on your ID.' }, { status: 400 });
  }
  // Checked on the server as well as in the form: the age gate is the one rule
  // here that a hand-made request must not be able to walk past.
  const age = checkAge(dob);
  if (!age.ok) {
    return NextResponse.json(
      { error: `You must be ${MIN_AGE} or over to enter ELECTROCUP 26.` },
      { status: 400 },
    );
  }
  if (!idCanon) {
    // Deliberately generic: naming the accepted length or character set would
    // hand a prober the shape of a valid number.
    return rejected(ip, 400, 'That ID number does not look right. Check it and try again.');
  }
  if (!acceptedTerms) {
    return NextResponse.json(
      { error: 'You need to accept the rulebook and privacy policy to enter.' },
      { status: 400 },
    );
  }
  if (!gamertag) {
    return NextResponse.json({ error: 'Pick one of the suggested gamertags.' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Choose a password of at least 8 characters — you sign in with it from now on.' }, { status: 400 });
  }

  const club = await queryOne(`SELECT code FROM clubs WHERE code = $1`, [clubCode.toUpperCase()]);
  if (!club) return NextResponse.json({ error: 'Unknown club.' }, { status: 400 });

  // One entry per player, for the whole tournament. These lookups exist to give a
  // useful message ("you're already in with ARS"); they are NOT the enforcement —
  // two concurrent submits would both pass them. The unique indexes in
  // db/schema.sql are what make it impossible, and the 23505 handler below turns
  // that into the same answer.
  const existing = await queryOne<{ club_code: string }>(
    `SELECT club_code FROM registrations
     WHERE user_id = $1 OR ec_email_canon(email) = ec_email_canon($2) LIMIT 1`,
    [session.sub, session.email],
  );
  if (existing) {
    return NextResponse.json({ error: alreadyEntered(existing.club_code) }, { status: 409 });
  }

  const idHash = hashId(idCanon);
  const idTaken = await queryOne(
    `SELECT 1 FROM registrations WHERE id_hash = $1 LIMIT 1`, [idHash],
  );
  if (idTaken) {
    return rejected(ip, 409, ID_TAKEN);
  }

  const tagTaken = await queryOne(
    `SELECT 1 FROM registrations
     WHERE gamertag IS NOT NULL AND ec_tag_canon(gamertag) = ec_tag_canon($1) LIMIT 1`,
    [gamertag],
  );
  if (tagTaken) {
    return NextResponse.json({ error: TAG_TAKEN }, { status: 409 });
  }

  // Set the password before inserting the entry: if the insert loses a race
  // (409 below), the player still ends up able to sign in — the reverse order
  // could leave a registered player with no password at all.
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
    await hashPassword(password),
    session.sub,
  ]);

  try {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO registrations
         (user_id, full_name, email, club_code, city, phone, date_of_birth,
          accepted_terms_at, gamertag, id_hash, id_last4)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8, $9, $10) RETURNING id`,
      [session.sub, fullName, session.email, clubCode.toUpperCase(), city, phone,
       dob.toISOString().slice(0, 10), gamertag, idHash, idLast4(idCanon)],
    );

    // Staff copy of the entry. Deliberately after the INSERT and never awaited
    // for success: the registration is already saved, so a mail outage must not
    // turn a completed entry into an error the player sees. notifyOps bounds how
    // long this can hold up their response.
    if (notifyEachRegistration()) await notifyOps(
      `New ELECTROCUP entry — ${fullName} (${clubCode.toUpperCase()})`,
      [
        `Name:      ${fullName}`,
        `Gamertag:  ${gamertag}`,
        `Club:      ${clubCode.toUpperCase()}`,
        `Email:     ${session.email ?? '—'}`,
        `City:      ${city || '—'}`,
        `Phone:     ${phone}`,
        `ID ending: ${idLast4(idCanon)}`,
        `Age:       ${age.age}${age.needsGuardianConsent ? ' — GUARDIAN CONSENT FORM REQUIRED' : ''}`,
        `Entry ID:  ${row!.id}`,
      ].join('\n'),
    );

    // Confirmation to the player. Must state that nothing was charged: the fee
    // is collected at the venue, and an entrant who is unsure whether they have
    // paid is the one who turns up expecting not to owe anything.
    const clubName = await queryOne<{ name: string }>(
      `SELECT name FROM clubs WHERE code = $1`, [clubCode.toUpperCase()],
    );
    if (session.email) {
      await sendMail({
        to: session.email,
        subject: `You're in — ELECTROCUP 26 (${clubName?.name ?? clubCode.toUpperCase()})`,
        text: [
          `Hi ${fullName.split(' ')[0]},`,
          '',
          `Your entry for ELECTROCUP 26 is confirmed.`,
          '',
          `Club:      ${clubName?.name ?? clubCode.toUpperCase()}`,
          `Gamertag:  ${gamertag}`,
          `Entry ID:  ${row!.id}`,
          '',
          'NO PAYMENT HAS BEEN TAKEN.',
          'Registration is free of charge. A qualifier session fee is payable in advance',
          'of your scheduled session, and covers venue hire, tournament hardware,',
          'officials and production. The amount and accepted payment methods will be',
          'published before registration closes. No action is required from you in respect',
          'of payment at this time.',
          '',
          'Bring your photo ID to your session. We check it there and keep no copy.',
          'We do not store your identity number — only an irreversible code derived',
          'from it.',
          ...(age.needsGuardianConsent ? ['', GUARDIAN_NOTICE] : []),
          '',
          'One entry per player. Registering twice means immediate disqualification.',
          '',
          '— NexGen PLC, Addis Ababa',
        ].join('\n'),
      }).catch((e) => console.error('[register] confirmation email failed:', e));
    }

    return NextResponse.json({ ok: true, id: row!.id, needsGuardianConsent: age.needsGuardianConsent });
  } catch (e: unknown) {
    const err = e as { code?: string; constraint?: string };
    if (err?.code === '23505') {
      // Lost a race against the player's own duplicate submit (or an alias of
      // their address). Which index fired tells us what to say.
      const msg =
        err.constraint === 'uniq_reg_tag' ? TAG_TAKEN
        : err.constraint === 'uniq_reg_idnum' ? ID_TAKEN
        : alreadyEntered(null);
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    throw e;
  }
}

const TAG_TAKEN =
  'Someone just took that gamertag. Pick another from the list.';

const ID_TAKEN =
  'That ID is already registered for ELECTROCUP 26. Registering twice means immediate disqualification. If this is a mistake, appeal below and we will review it.';

// One entry per player is enforced by disqualification, so this message has to
// state the consequence plainly — and point at the appeal, since honest mistakes
// (a shared family email) land here too.
function alreadyEntered(clubCode: string | null): string {
  const where = clubCode ? ` You are entered with ${clubCode}.` : '';
  return `You have already registered for ELECTROCUP 26.${where} Registering twice means immediate disqualification — do not submit again. If you need to change club or think this is a mistake, appeal below.`;
}

// GET /api/register — the current player's own registrations (for the confirm page).
export async function GET() {
  const session = getSession('user');
  if (!session) return NextResponse.json({ registrations: [] });
  const rows = await query(
    `SELECT r.id, r.full_name, r.gamertag, r.club_code, c.name AS club_name,
            r.city, r.phone, r.date_of_birth,
            r.payment_status, r.status, r.created_at
     FROM registrations r JOIN clubs c ON c.code = r.club_code
     WHERE r.user_id = $1 OR ec_email_canon(r.email) = ec_email_canon($2)
     ORDER BY r.created_at DESC`,
    [session.sub, session.email],
  );
  return NextResponse.json({ registrations: rows });
}
