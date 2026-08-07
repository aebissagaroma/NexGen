// Gamertag suggestions built from a player's own name.
//
// Players no longer invent a tag — the tournament supplies the hardware, and
// asking someone for an "in-game name" they may not have was turning people
// away. Instead we offer handles derived from the name they already gave, and
// they pick one. It still has to be unique, because it is the handle shown on
// brackets, standings and broadcast.
//
// Tags are English/Latin only by design. A name written in Amharic has no A–Z
// characters to build from and falls through to the numbered fallback at the
// bottom; the registration form asks for the Latin spelling on the player's ID.

const MIN = 3;
const MAX = 20;

export const TAG_MIN = MIN;
export const TAG_MAX = MAX;

/**
 * A player's own choice of tag, canonicalised, or null if it cannot be one.
 *
 * Players type their own handle — the suggestions below are only a starting
 * point for anyone who does not want to invent one. Stored uppercase so the
 * brackets, the standings table and the broadcast lower third all read the same
 * way regardless of how it was typed.
 *
 * A–Z and 0–9 only, and no spaces. This is narrower than ec_tag_canon() in
 * db/schema.sql, which only lowercases and strips whitespace: if punctuation
 * were allowed here then "AB-C" and "ABC" would be two different tags to the
 * unique index while being indistinguishable to a commentator reading them out.
 * Keeping the accepted set tight is what makes that index mean what it looks
 * like it means.
 */
export function canonicalTag(raw: unknown): string | null {
  const t = String(raw ?? '').trim().toUpperCase();
  if (t.length < MIN || t.length > MAX) return null;
  if (!/^[A-Z0-9]+$/.test(t)) return null;
  // At least one letter. An all-digit tag reads as an entry number on a bracket
  // and is impossible to say out loud as a name.
  if (!/[A-Z]/.test(t)) return null;
  return t;
}

/**
 * Punchy words paired with the player's name, so tags read like a competitor's
 * handle rather than a username. Kept to short, broadcast-friendly words that a
 * commentator can say quickly.
 */
const POWER = [
  'THUNDER', 'STORM', 'BLAZE', 'INFERNO', 'FURY', 'TITAN', 'VIPER', 'COBRA',
  'FALCON', 'HAWK', 'EAGLE', 'PHANTOM', 'SHADOW', 'RAPTOR', 'BOLT', 'VOLT',
  'SURGE', 'QUAKE', 'COMET', 'ROCKET', 'FROST', 'VENOM', 'REAPER', 'HUNTER',
  'SNIPER', 'WOLF', 'TIGER', 'LION', 'PANTHER', 'JET', 'ACE', 'PRIME',
  'APEX', 'FLASH', 'NOVA', 'MAVERICK', 'STRIKER', 'ROGUE', 'BLITZ', 'TEMPEST',
];

/** Uppercase A–Z0–9 only. Returns '' if the word has no usable characters. */
function clean(word: string): string {
  return word.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Stable offset into POWER derived from the name, so two different players are
 * offered different words, but the same player retyping their name sees the same
 * suggestions rather than a list that reshuffles under them.
 */
function seedFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Candidate tags for a name, best first, deduplicated.
 *
 * Deliberately over-generates: the API filters out tags already taken, so a
 * common name still has plenty left to choose from.
 */
export function tagCandidates(fullName: string): string[] {
  const raw = String(fullName ?? '');
  const parts = raw.split(/\s+/).map(clean).filter((p) => p.length > 0);

  const out: string[] = [];
  const push = (t: string) => {
    if (t.length >= MIN && t.length <= MAX && !out.includes(t)) out.push(t);
  };

  if (parts.length > 0) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const seed = seedFor(parts.join(''));

    // Lead with name + power word: this is the "catchy" shape most players want.
    // Only whole-name combinations — pairing a word with a bare initial produced
    // limp tags like FLASHA and NOVAY.
    const shortFirst = first.slice(0, 5);
    for (let i = 0; i < POWER.length; i++) {
      const w = POWER[(seed + i) % POWER.length];
      push(first + w);
      push(w + first);
      if (parts.length > 1) push(w + last);
      if (shortFirst !== first) push(shortFirst + w);
      if (out.length > 60) break;
    }

    // Plainer name-only handles, for anyone who wants their name unadorned.
    push(first);
    if (parts.length > 1) {
      push(first + last[0]);
      push(first[0] + last);
      push(last);
    }

    // Numbered fallbacks so a very common name never runs out.
    const bases = parts.length > 1 ? [first, first + last[0], last] : [first];
    for (let n = 1; n <= 20; n++) {
      for (const b of bases) push(b + n);
      if (out.length > 120) break;
    }
  }

  // Nothing usable — e.g. a name typed entirely in Amharic script. The form asks
  // for the Latin spelling, but a generic handle beats a broken form.
  if (out.length === 0) {
    const seed = seedFor(raw) % POWER.length;
    for (let n = 1; n <= 40; n++) push(POWER[(seed + n) % POWER.length] + String(n).padStart(2, '0'));
  }
  return out;
}
