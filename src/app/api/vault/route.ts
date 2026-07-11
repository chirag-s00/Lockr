import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { vaultItems } from '@/db/schema'
import { encryptData } from '@/lib/crypto'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { NotePayload } from '@/types/vault'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, noteBody, type } = body

  if (!title || !noteBody || !type) {
    return NextResponse.json(
      { error: 'title, noteBody, and type are required' },
      { status: 400 }
    )
  }

  const payload: NotePayload = { body: noteBody }
  const { ciphertext, iv } = encryptData(payload)

  const item = await db
    .insert(vaultItems)
    .values({
      id: nanoid(),
      userId: session.user.id,
      type,
      title,
      encryptedData: ciphertext,
      iv,
    })
    .returning()

  return NextResponse.json({ item: item[0] }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()

  await db
    .delete(vaultItems)
    .where(
      and(
        eq(vaultItems.id, id),
        eq(vaultItems.userId, session.user.id)
      )
    )

  return NextResponse.json({ success: true })
}