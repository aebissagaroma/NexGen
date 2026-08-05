// Cloudflare Turnstile verification.
//
// Required on /api/register once an IP has had CHALLENGE_AFTER_FAILURES rejected
// attempts, so someone probing ID numbers one at a time has to solve a challenge
// to keep going while a genuine entrant fixing a typo does not.
//
// INERT UNTIL KEYS ARE SET. With no TURNSTILE_SECRET_KEY the challenge is
// skipped rather than blocking every registration — a missing key must not take
// sign-ups down. isChallengeConfigured() reports which state we are in so the
// route can log it and the client knows whether to render the widget.
//
// Requires two variables:
//   TURNSTILE_SECRET_KEY             — server-side, verifies the token
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY   — public, renders the widget
// The site key is public by design; the secret key must never reach the client.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** How many rejected attempts from one IP before a challenge is demanded. */
export const CHALLENGE_AFTER_FAILURES = 3;

export function isChallengeConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Verify a token with Cloudflare. Returns true when the challenge is not
 * configured, so an unset key cannot block registration.
 *
 * Fails CLOSED on a network error, unlike the rate limiter which fails open:
 * this only ever runs for an IP that has already been rejected several times, so
 * the cost of a false block falls on a suspected prober, not a first-time
 * entrant.
 */
export async function verifyChallenge(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== 'string' || !token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // Bounded: this sits inside a player's request.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error('[challenge] verification failed:', e);
    return false;
  }
}
