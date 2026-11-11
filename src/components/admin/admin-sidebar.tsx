'use client'

import {
  Briefcase,
  Camera,
  FolderKanban,
  GraduationCap,
  Globe,
  Inbox,
  Languages,
  LayoutDashboard,
  LogOut,
  Medal,
  Settings,
  Share2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'
import { ThemeToggle } from '@/components/admin/admin-theme-toggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { ADMIN_HINT_KEY } from '@/lib/navigation'

type Item = { href: string; label: string; icon: LucideIcon }

const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/site', label: 'Site & texts', icon: Settings },
      { href: '/admin/experience', label: 'Experience', icon: Briefcase },
      { href: '/admin/education', label: 'Education', icon: GraduationCap },
      { href: '/admin/certifications', label: 'Certifications', icon: Medal },
      { href: '/admin/skills', label: 'Skills', icon: Sparkles },
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { href: '/admin/languages', label: 'Languages', icon: Languages },
      { href: '/admin/social', label: 'Social links', icon: Share2 },
    ],
  },
  {
    label: 'Media & inbox',
    items: [
      { href: '/admin/photos', label: 'Photos', icon: Camera },
      { href: '/admin/messages', label: 'Messages', icon: Inbox },
    ],
  },
]

/** The ONLY sidebar in the app: shadcn Sidebar, collapsible, Sheet on mobile. */
export function AdminSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon" aria-label="Admin navigation">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="View site">
              <Link href="/" prefetch={false}>
                <Globe />
                <span>View site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form
              action={logout}
              onSubmit={() => {
                try {
                  window.localStorage.removeItem(ADMIN_HINT_KEY)
                } catch {
                  /* storage unavailable: the hint is cosmetic */
                }
              }}
            >
              <SidebarMenuButton type="submit" tooltip="Sign out">
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
