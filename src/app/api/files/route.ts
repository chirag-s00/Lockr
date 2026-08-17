import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { vaultItems, vaultFiles } from '@/db/schema'
import { s3, BUCKET } from '@/lib/s3'
import { encryptBuffer } from '@/lib/crypto'
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { validate } from '@/lib/validate'
import { deleteFileSchema, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/schemas'
import { z } from 'zod'
import { getRequestInfo,writeAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null

  // validate title
  const titleValidation = validate(
    z.string().min(1, 'Title is required').max(100).trim(),
    title
  )
  if (!titleValidation.success) return titleValidation.response

  // validate file exists
  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 })
  }

  // validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File must be under ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    )
  }

  // validate file type
 if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
  return NextResponse.json(
    { error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
    { status: 400 }
  )
}

  const arrayBuffer = await file.arrayBuffer()
  const { ciphertext, iv } = encryptBuffer(Buffer.from(arrayBuffer))

  const s3Key = `${session.user.id}/${nanoid()}`

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: ciphertext,
    ContentType: 'application/octet-stream',
  }))

  const vaultItemId = nanoid()
  await db.insert(vaultItems).values({
    id: vaultItemId,
    userId: session.user.id,
    type: 'document',
    title: titleValidation.data,
    encryptedData: '',
    iv: '',
  })

  const fileRecord = await db.insert(vaultFiles).values({
    id: nanoid(),
    vaultItemId,
    s3Key,
    filename: file.name,
    size: file.size,
    mimeType: file.type,
    iv,
  }).returning()

  const { ipAddress, userAgent } = getRequestInfo(request)

  await writeAuditLog({
  userId: session.user.id,
  action: 'document_uploaded',
  metadata: {
    title: titleValidation.data,
    filename: file.name,
    size: file.size,
  },
  ipAddress,
  userAgent,
})

  return NextResponse.json({ file: fileRecord[0] }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = validate(deleteFileSchema, body)
  if (!validation.success) return validation.response

  const { fileId } = validation.data

  const file = await db
    .select({
      id: vaultFiles.id,
      s3Key: vaultFiles.s3Key,
      vaultItemId: vaultFiles.vaultItemId,
    })
    .from(vaultFiles)
    .innerJoin(vaultItems, eq(vaultFiles.vaultItemId, vaultItems.id))
    .where(
      and(
        eq(vaultFiles.id, fileId),
        eq(vaultItems.userId, session.user.id)
      )
    )
    .then(r => r[0])

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: file.s3Key,
  }))

  await db
    .delete(vaultItems)
    .where(eq(vaultItems.id, file.vaultItemId))

  const { ipAddress, userAgent } = getRequestInfo(request)
    await writeAuditLog({
        userId: session.user.id,
        action: 'document_deleted',
        metadata: { fileId },
        ipAddress,
        userAgent,
    })

  return NextResponse.json({ success: true })
}