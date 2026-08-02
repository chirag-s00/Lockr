import { db } from '@/db'
import { vaultItems, vaultFiles } from '@/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq, and, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { decryptData } from '@/lib/crypto'
import { DashboardView } from '@/modules/dashboard/dashboard-view'
import type { NotePayload } from '@/types/vault'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) redirect('/sign-in')

  const recentNoteItems = await db
    .select()
    .from(vaultItems)
    .where(
      and(
        eq(vaultItems.userId, session.user.id),
        eq(vaultItems.type, 'note')
      )
    )
    .orderBy(desc(vaultItems.createdAt))
    .limit(3)

  const recentNotes = recentNoteItems.map(item => ({
    id: item.id,
    title: item.title,
    createdAt: item.createdAt,
    ...decryptData<NotePayload>({
      ciphertext: item.encryptedData,
      iv: item.iv,
    }),
  }))

  const recentDocuments = await db
    .select({
      id: vaultFiles.id,
      title: vaultItems.title,
      filename: vaultFiles.filename,
      size: vaultFiles.size,
      mimeType: vaultFiles.mimeType,
      createdAt: vaultItems.createdAt,
    })
    .from(vaultFiles)
    .innerJoin(vaultItems, eq(vaultFiles.vaultItemId, vaultItems.id))
    .where(eq(vaultItems.userId, session.user.id))
    .orderBy(desc(vaultItems.createdAt))
    .limit(3)

  const allItems = await db
    .select({ id: vaultItems.id, type: vaultItems.type })
    .from(vaultItems)
    .where(eq(vaultItems.userId, session.user.id))


  return (
    <DashboardView
      email={session.user.email}
      recentNotes={recentNotes}
      recentDocuments={recentDocuments}
    />
  )
}