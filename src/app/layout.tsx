import type { Metadata } from 'next'
import { Geist, Inter } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Personal Vault',
  description: 'Your secure personal vault',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className={geist.className}>
        {children}
      </body>
    </html>
  )
}