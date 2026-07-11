"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const DashboardView = () => {
  const router = useRouter()

  return (
    <div>
    <div className="flex gap-4">
      <Button asChild>
        <Link href="/notes">
          Notes
        </Link>
      </Button>

      <Button asChild>
        <Link href="/documents">
          Documents
        </Link>
      </Button>
    </div>
    <Button
      onClick={async () => {
        await authClient.signOut()

        router.refresh()
        router.push("/sign-in")
      }}
    >
      Logout
    </Button>
    </div>
  )
}
