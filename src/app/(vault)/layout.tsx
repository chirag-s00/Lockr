import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/LogoutButton'
import { SidebarLink } from '@/components/SidebarLink'

export default async function VaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/sign-in");
  }

  return (
  <div className="flex h-screen">
    <aside className="w-64 min-w-64 h-screen border-r flex flex-col p-4 gap-1 overflow-hidden">
      <p className="text-xs font-medium text-muted-foreground px-2 mb-2">
        Personal Vault
      </p>

      <SidebarLink href="/dashboard" label="Dashboard" />
      <SidebarLink href="/notes" label="Notes" />
      <SidebarLink href="/documents" label="Documents" />

        <p className="text-xs text-muted-foreground px-2 truncate">
          {session.user.email}
        </p>
        <LogoutButton />
    </aside>

    <main className="flex-1 h-screen overflow-y-auto">
      {children}
    </main>
  </div>
  )
}