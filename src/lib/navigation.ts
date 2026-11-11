/** Public top-bar entries, in order. `section` entries are anchors on the home page; `page` entries are routes. */
export const NAV_ITEMS = [
  { key: 'experience', kind: 'section' },
  { key: 'education', kind: 'section' },
  { key: 'skills', kind: 'section' },
  { key: 'projects', kind: 'section' },
  { key: 'photos', kind: 'page', href: '/photos' },
  { key: 'contact', kind: 'section' },
] as const

export type NavKey = (typeof NAV_ITEMS)[number]['key']

/** Home-page section ids observed by the scroll-spy. */
export const SPY_SECTIONS = NAV_ITEMS.filter((i) => i.kind === 'section').map((i) => i.key)

/** localStorage flag: "an admin signed in on this browser". UI hint only, never trusted by the server. */
export const ADMIN_HINT_KEY = 'site-admin-hint'

/** Which nav entry is active for a pathname that has no locale prefix. */
export function activeKeyForPath(pathname: string): NavKey | null {
  const first = pathname.split('/').filter(Boolean)[0]
  switch (first) {
    case 'experience':
    case 'education':
    case 'skills':
    case 'projects':
    case 'photos':
    case 'contact':
      return first
    case 'certifications':
      return 'education'
    default:
      return null
  }
}
