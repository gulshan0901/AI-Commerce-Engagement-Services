"use client";

/** Supplies a guest-compatible session shape to legacy authenticated screens. */

const guestSession = { access_token: "" } as const;

export function useAuthSession() {
  return { session: guestSession, loading: false };
}
