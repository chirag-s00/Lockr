import { db } from '@/db'
import { vaultItems, vaultFiles } from '@/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { DocumentsList } from '@/modules/documents/DocumentsList'

export default async function DocumentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) redirect('/sign-in')

  const items = await db
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium mb-6">Documents</h1>
      <DocumentsList documents={items} />
    </div>
  )
}