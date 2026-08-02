'use client'

import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await authClient.signOut()
    router.push("/")
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-muted-foreground"
      onClick={handleLogout}
    >
      Sign out
    </Button>
  )
}