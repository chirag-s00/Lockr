import { db } from '@/db'
import { vaultItems } from '@/db/schema'
import { decryptData } from '@/lib/crypto'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import type { NotePayload } from '@/types/vault'
import { NotesList } from '@/modules/notes/NotesList'

export default async function NotesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) redirect('/sign-in')

  const items = await db
    .select()
    .from(vaultItems)
    .where(
      and(
        eq(vaultItems.userId, session.user.id),
        eq(vaultItems.type, 'note')
      )
    )

  const notes = items.map(item => ({
    id: item.id,
    title: item.title,
    createdAt: item.createdAt,
    ...decryptData<NotePayload>({
      ciphertext: item.encryptedData,
      iv: item.iv,
    }),
  }))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium mb-6">Notes</h1>
      <NotesList notes={notes} />
    </div>
  )
}