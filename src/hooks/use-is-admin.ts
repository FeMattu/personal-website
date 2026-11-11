'use client'

import { useSyncExternalStore } from 'react'
import { ADMIN_HINT_KEY } from '@/lib/navigation'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function read(): boolean {
  try {
    return window.localStorage.getItem(ADMIN_HINT_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Cosmetic hint ("an admin signed in on this browser") so the public layout can stay static
 * (no `auth()`/cookies). The server never trusts it: `/admin` re-checks the session.
 */
export function useIsAdmin(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}
