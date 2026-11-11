import type { ReactNode } from 'react'
import { AdminHintSetter } from '@/components/admin/admin-hint-setter'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { requireAdmin } from '@/lib/auth/session'

/** Admin shell: the real session check (the proxy only does an optimistic cookie check). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin()
  return (
    <SidebarProvider>
      <AdminHintSetter />
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger aria-label="Toggle sidebar" />
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm text-muted-foreground">{session.user?.email}</span>
        </header>
        <main id="admin-main" className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
