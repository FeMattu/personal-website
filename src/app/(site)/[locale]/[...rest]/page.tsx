import { notFound } from 'next/navigation'

/** Any unknown path under a valid locale is a real, localized 404 (see not-found.tsx). */
export default function CatchAll() {
  notFound()
}
