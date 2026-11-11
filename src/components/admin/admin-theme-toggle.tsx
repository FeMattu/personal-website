'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { SidebarMenuButton } from '@/components/ui/sidebar'

/** Cycles light -> dark -> system. Admin UI is English only, so labels are plain strings. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  return (
    <SidebarMenuButton
      type="button"
      tooltip={`Theme: ${theme ?? 'system'}`}
      onClick={() => setTheme(next)}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
      <span>Theme: {theme ?? 'system'}</span>
    </SidebarMenuButton>
  )
}
