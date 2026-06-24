"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  return (
    <button
      onClick={async () => {
        await authClient.signOut()

        router.refresh()
        router.push("/sign-in")
      }}
    >
      Logout
    </button>
  )
}