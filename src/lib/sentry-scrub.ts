// Strip anything an entrant typed before an event leaves for Sentry.
//
// CLAUDE.md: the raw national ID number is never stored, logged, returned, or
// sent to error reporting. Sentry's request integration can attach request
// bodies, query strings and cookies to server errors, and the confirm-entry and
// registration endpoints carry ID numbers, phone numbers, dates of birth and
// passwords. Error reports keep the stack and the route, never the input.
import type { ErrorEvent } from '@sentry/nextjs';

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.headers) {
      const { cookie, authorization, Cookie, Authorization, ...rest } = event.request.headers as Record<string, string>;
      void cookie; void authorization; void Cookie; void Authorization;
      event.request.headers = rest;
    }
  }
  if (event.user) event.user = { id: event.user.id };
  return event;
}
