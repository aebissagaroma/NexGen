// What a player may not call themselves.
//
// Gamertags are chosen freely and then printed on brackets, the standings table
// and the broadcast lower third, so this is the only thing standing between an
// entrant and an obscenity on screen. It is a floor, not a moderation policy:
// it stops the obvious, and ops still have to be able to look at the list and
// rename anything that gets through — see PATCH /api/admin/registrations.
//
// EXTENDING THIS: add to EXACT if the word is short or appears inside innocent
// words, and to CONTAINS only if seeing those letters in sequence is damning on
// its own. Getting that the wrong way round is how a filter ends up rejecting
// real names.

/**
 * Fold the tricks used to slip a word past a filter: repeated letters and
 * digits standing in for letters. Applied to the tag before matching, never to
 * what gets stored.
 *
 * 'FUUUCK' and 'F0CK' both fold to 'FUCK'. It also folds innocent tags — the
 * collapse turns 'BOOKER' into 'BOKER' — which is harmless, because the folded
 * form is only ever compared against the lists below.
 */
function fold(tag: string): string {
  return tag
    .toUpperCase()
    .replace(/0/g, 'O').replace(/1/g, 'I').replace(/3/g, 'E').replace(/4/g, 'A')
    .replace(/5/g, 'S').replace(/7/g, 'T').replace(/8/g, 'B').replace(/9/g, 'G')
    .replace(/(.)\1+/g, '$1');
}

/**
 * Blocked only when they are the whole tag.
 *
 * Every entry here is a substring of ordinary words or names — ASS is in
 * BASSAM, CUM is in CUMMINGS, HELL is in SHELLEY — so matching them anywhere
 * would reject real people. As a complete tag none of them is an accident.
 */
const EXACT = new Set([
  'ASS', 'ARSE', 'CUM', 'HELL', 'DAMN', 'CRAP', 'TIT', 'TITS', 'FAG',
  'SLUT', 'PISS', 'DICK', 'COCK', 'KKK', 'NAZI', 'HITLER', 'ISIS',
  // Reserved: an entrant appearing on a bracket under any of these is
  // impersonating the organisers or an official.
  'ADMIN', 'ADMINISTRATOR', 'OFFICIAL', 'OFFICIALS', 'REFEREE', 'REF', 'MOD',
  'MODERATOR', 'STAFF', 'ORGANISER', 'ORGANIZER', 'SYSTEM', 'ROOT', 'NULL',
  'UNDEFINED', 'ANONYMOUS', 'TBA', 'TBD', 'BYE', 'EASPORTS', 'FIFA',
].map(fold));

/**
 * Real words that contain a blocked one. Removed from the tag before scanning,
 * so SEXTON and SUSSEX survive a rule that exists to catch SEX.
 *
 * This is where a false positive gets fixed. When a player reports that their
 * own name was rejected, the answer is almost always a new entry here rather
 * than a weaker rule — and ops can set the tag by override in the meantime.
 */
const ALLOW = ['SEXTON', 'SUSSEX', 'ESSEX', 'MIDLESEX', 'ANALYST', 'ANALYSIS'].map(fold);

/**
 * Blocked anywhere in the tag. Kept to strings that are not plausible fragments
 * of a name in any language we expect to see on an entry form.
 */
const CONTAINS = [
  'FUCK', 'SHIT', 'BITCH', 'WHORE', 'RAPE', 'RAPIST', 'PEDO', 'PAEDO',
  'NIGGER', 'NIGGA', 'FAGGOT', 'RETARD', 'CUNT', 'WANK', 'BASTARD',
  'PORN', 'PENIS', 'VAGINA', 'BOOBS', 'NUDE', 'SEX', 'ANAL', 'JIZZ',
  'SUICIDE', 'GENOCIDE', 'TERRORIST',
  // Impersonating the competition itself, in any position: NEXGENADMIN and
  // ELECTROCUP26 both read as an organiser account on a public bracket.
  'NEXGEN', 'ELECTROCUP',
].map(fold);

/**
 * True if this tag may not be used. Expects an already shape-valid tag from
 * canonicalTag() — uppercase A–Z0–9.
 */
export function isBlockedTag(tag: string): boolean {
  const folded = fold(tag);
  if (EXACT.has(folded)) return true;

  // Both sides are folded, which is why the lists above are mapped through
  // fold() too: 'NIGGA' folds to 'NIGA', and comparing a folded tag against an
  // unfolded list would let exactly the spellings this is meant to catch pass.
  let scan = folded;
  for (const safe of ALLOW) scan = scan.split(safe).join('');
  return CONTAINS.some((bad) => scan.includes(bad));
}
