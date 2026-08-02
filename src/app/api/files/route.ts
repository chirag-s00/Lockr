import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { vaultItems, vaultFiles } from '@/db/schema'
import { s3, BUCKET } from '@/lib/s3'
import { encryptBuffer, decryptBuffer } from '@/lib/crypto'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
// GET — generate a presigned download URL for a file
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fileId = request.nextUrl.searchParams.get('fileId')
  if (!fileId) {
    return NextResponse.json({ error: 'fileId required' }, { status: 400 })
  }

  const file = await db
    .select()
    .from(vaultFiles)
    .where(eq(vaultFiles.id, fileId))
    .then(r => r[0])

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: file.s3Key }),
    { expiresIn: 900 }
  )

  return NextResponse.json({ url, iv: file.iv, mimeType: file.mimeType })
}

// POST — upload a file: encrypt it, push to S3, save metadata
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const title = formData.get('title') as string

  if (!file || !title) {
    return NextResponse.json({ error: 'file and title required' }, { status: 400 })
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
    title,
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

  return NextResponse.json({ file: fileRecord[0] }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fileId } = await request.json()
  if (!fileId) {
    return NextResponse.json({ error: 'fileId required' }, { status: 400 })
  }

  // get the file, scoped to current user
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

  // delete from S3 first
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: file.s3Key,
    })
  )

  // delete vault_item — cascades to vault_files automatically
  await db
    .delete(vaultItems)
    .where(eq(vaultItems.id, file.vaultItemId))

  return NextResponse.json({ success: true })
}