// Shared DTOs / domain types. Keep in sync with db/schema.sql.

export interface Club {
  code: string;
  name: string;
  city: string;
  sort: number;
}

// ── Registration ────────────────────────────────────────────────────────────
// TODO(dev): This is the working minimum captured by /api/register. Confirm the
// full field set with NexGen ops and extend BOTH this interface and the
// `registrations` table together. Candidate additions are stubbed below.
export interface RegistrationInput {
  fullName: string;
  email: string;        // taken from the verified session in practice
  gamertag: string;
  clubCode: string;
  platform?: string;    // TODO(dev): enum 'PS5' | 'PC' | 'XBOX' once confirmed
  city?: string;
  // TODO(dev): dateOfBirth?: string;      // eligibility: 16+
  // TODO(dev): psnOrEaId?: string;        // required to schedule matches
  // TODO(dev): jerseyName?: string;       // broadcast lower-third
  // TODO(dev): emergencyContact?: string;
  // TODO(dev): agreesToRules: boolean;    // rulebook v1.2 acceptance
}

export interface Registration extends RegistrationInput {
  id: string;
  userId: string | null;
  paymentStatus: 'unpaid' | 'paid' | 'waived';
  status: 'pending' | 'confirmed' | 'rejected';
  notes: string | null;
  createdAt: string;
}

export interface SponsorInquiryInput {
  company: string;
  contactName: string;
  email: string;
  phone?: string;
  tier?: string;
  message?: string;
}

export interface Match {
  id: string;
  clubCode: string;
  round: string;
  slot: number;
  playerA: string | null;
  playerB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: 'a' | 'b' | null;
}

export interface StandingRow {
  clubCode: string;
  playerTag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}
