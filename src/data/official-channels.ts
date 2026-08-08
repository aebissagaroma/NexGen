// The definitive list of channels NexGen operates for ELECTROCUP 26.
//
// This page exists to be checked against. Someone who has just been messaged
// asking for money comes here to find out whether it was us, so every value
// below has to be one ops can vouch for — a handle listed here that nobody
// watches is worse than no list at all.
//
// Kept as data rather than inline JSX so the footer, the page and any future
// email signature all read the same handles.

export const OFFICIAL_DOMAIN = 'nexgentournaments.com';
export const OFFICIAL_EMAIL_SUFFIX = '@nexgentournaments.com';

export interface Channel { platform: string; handle: string; href: string }

export const SOCIAL_CHANNELS: Channel[] = [
  { platform: 'TikTok', handle: '@electrocup26', href: 'https://www.tiktok.com/@electrocup26' },
  { platform: 'Instagram', handle: '@electrocup26', href: 'https://www.instagram.com/electrocup26' },
  { platform: 'Telegram', handle: 't.me/electrocup26', href: 'https://t.me/electrocup26' },
  { platform: 'YouTube', handle: '/nexgenplc', href: 'https://www.youtube.com/@nexgenplc' },
  { platform: 'Twitch', handle: '/electrocup', href: 'https://www.twitch.tv/electrocup' },
];

/**
 * Where to report an impersonation.
 *
 * NOT invented. NexGen has not supplied this address yet, and putting a
 * plausible-looking one here would send real fraud reports nowhere — the exact
 * failure this page exists to prevent. Set NEXT_PUBLIC_REPORT_EMAIL and the
 * address appears; until then the page says plainly that it is being published,
 * rather than printing a placeholder that reads like a working contact.
 */
export const REPORT_EMAIL = process.env.NEXT_PUBLIC_REPORT_EMAIL || null;

export const NEVER_CONTACT = [
  'We will never message you asking for payment.',
  'We will never ask for your identity number by direct message, phone call or email.',
  'We will never ask for your password, a verification code, or a bank or mobile money PIN.',
  'We will never ask you to pay through a personal account.',
];
