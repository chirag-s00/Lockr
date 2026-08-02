import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { vaultFiles, vaultItems } from '@/db/schema'
import { s3, BUCKET } from '@/lib/s3'
import { decryptBuffer } from '@/lib/crypto'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fileId = request.nextUrl.searchParams.get('fileId')
  if (!fileId) {
    return NextResponse.json({ error: 'fileId required' }, { status: 400 })
  }

  // fetch file metadata, scoped to current user via join
  const file = await db
    .select({
      id: vaultFiles.id,
      s3Key: vaultFiles.s3Key,
      filename: vaultFiles.filename,
      mimeType: vaultFiles.mimeType,
      iv: vaultFiles.iv,
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

  // fetch encrypted bytes from S3
  const s3Response = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: file.s3Key })
  )

  const chunks: Uint8Array[] = []
  for await (const chunk of s3Response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  const cipherBuffer = Buffer.concat(chunks)

  // decrypt server-side — key never leaves the server
  const plainBuffer = decryptBuffer(cipherBuffer, file.iv)

  return new NextResponse(new Uint8Array(plainBuffer), {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
    },
  })
}