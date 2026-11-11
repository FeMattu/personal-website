import {
  Award,
  Briefcase,
  Camera,
  FolderKanban,
  GraduationCap,
  Inbox,
  Languages,
  Link2,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export type AdminNavItem = { href: string; label: string; icon: LucideIcon }

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: '/admin/site', label: 'Site settings', icon: Settings },
  { href: '/admin/experience', label: 'Experience', icon: Briefcase },
  { href: '/admin/education', label: 'Education', icon: GraduationCap },
  { href: '/admin/certifications', label: 'Certifications', icon: Award },
  { href: '/admin/skills', label: 'Skills', icon: Sparkles },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/social', label: 'Social links', icon: Link2 },
  { href: '/admin/languages', label: 'Languages', icon: Languages },
  { href: '/admin/photos', label: 'Photos', icon: Camera },
  { href: '/admin/messages', label: 'Messages', icon: Inbox },
]
