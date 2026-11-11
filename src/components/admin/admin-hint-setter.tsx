'use client'

import { useEffect } from 'react'
import { ADMIN_HINT_KEY } from '@/lib/navigation'

/** Marks this browser as "an admin signed in" so the static public navbar can show the Admin link. */
export function AdminHintSetter() {
  useEffect(() => {
    try {
      window.localStorage.setItem(ADMIN_HINT_KEY, '1')
    } catch {
      /* storage unavailable: cosmetic only */
    }
  }, [])
  return null
}
