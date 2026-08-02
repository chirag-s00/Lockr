'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function SidebarLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href}>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start"
      >
        {label}
      </Button>
    </Link>
  )
}