import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { vaultItems } from '@/db/schema'
import { encryptData } from '@/lib/crypto'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { createNoteSchema, deleteNoteSchema, updateNoteSchema } from '@/lib/schemas'
import { validate } from '@/lib/validate'
import type { NotePayload } from '@/types/vault'
import {getRequestInfo, writeAuditLog} from '@/lib/audit'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = validate(createNoteSchema, body)
  if (!validation.success) return validation.response

  const { title, noteBody} = validation.data
   const { ipAddress, userAgent } = getRequestInfo(request)


  const payload: NotePayload = { body: noteBody }
  const { ciphertext, iv } = encryptData(payload)

  const item = await db
    .insert(vaultItems)
    .values({
      id: nanoid(),
      userId: session.user.id,
      type: 'note',
      title,
      encryptedData: ciphertext,
      iv,
    })
    .returning()

    await writeAuditLog({
    userId: session.user.id,
    action: 'note_created',
    metadata: { title },
    ipAddress,
    userAgent,
  })

  return NextResponse.json({ item: item[0] }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = validate(deleteNoteSchema, body)
  if (!validation.success) return validation.response

  const { id } = validation.data
  const { ipAddress, userAgent } = getRequestInfo(request)

  await db
    .delete(vaultItems)
    .where(
      and(
        eq(vaultItems.id, id),
        eq(vaultItems.userId, session.user.id)
      )
    )
     await writeAuditLog({
    userId: session.user.id,
    action: 'note_deleted',
    metadata: { id },
    ipAddress,
    userAgent,
  })


  return NextResponse.json({ success: true })
}

export async function PUT(request: NextRequest){
  const session = await auth.api.getSession({headers: await headers()})
  if (!session){
    return NextResponse.json({error:'Unauthorized'}, {status:401})
  }

  const body = await request.json()
  const validation = validate(updateNoteSchema, body)
  if(!validation.success) return validation.response

  const {id, title, noteBody} = validation.data
  const payload : NotePayload = {body : noteBody}
  const {ciphertext, iv} = encryptData(payload)

  const updated = await db
                    .update(vaultItems)
                    .set({
                      title,
                      encryptedData: ciphertext,
                      iv,
                      updatedAt: new Date(),
                    })
                    .where(
                      and(
                        eq(vaultItems.id,id),
                        eq(vaultItems.userId,session.user.id)
                      )
                    )
                    .returning()
                  
   if (!updated.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ item: updated[0] })
}

