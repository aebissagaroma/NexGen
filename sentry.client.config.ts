// Browser-side error tracking. Inert until NEXT_PUBLIC_SENTRY_DSN is set, so
// local dev and DSN-less deployments carry no reporting at all.
//
// Session replay is deliberately NOT enabled: the registration form handles
// phone numbers, dates of birth and passwords, and a pixel-accurate replay of
// that form is exactly the kind of copy the privacy notice promises we don't
// keep. Error events alone carry no form values.
import * as Sentry from '@sentry/nextjs';
import { scrubEvent } from '@/lib/sentry-scrub';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  });
}
