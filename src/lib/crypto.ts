import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32
const IV_BYTES = 12

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string')
  }
  return Buffer.from(hex, 'hex')
}

export function encryptData(data: object): {
  ciphertext: string
  iv: string
} {
  const key = getKey()
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const json = JSON.stringify(data)
  const encrypted = Buffer.concat([
    cipher.update(json, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ])

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
  }
}

export function decryptData<T>(encrypted: {
  ciphertext: string
  iv: string
}): T {
  const key = getKey()
  const iv = Buffer.from(encrypted.iv, 'base64')
  const data = Buffer.from(encrypted.ciphertext, 'base64')

  const authTag = data.subarray(data.length - 16)
  const ciphertext = data.subarray(0, data.length - 16)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return JSON.parse(decrypted.toString('utf8')) as T
}

export function encryptBuffer(
  buffer: Buffer,
): { ciphertext: Buffer; iv: string } {
  const key = getKey()
  const ivBytes = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, ivBytes)

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
    cipher.getAuthTag(),
  ])

  return {
    ciphertext: encrypted,
    iv: ivBytes.toString('base64'),
  }
}

export function decryptBuffer(
  ciphertext: Buffer,
  iv: string,
): Buffer {
  const key = getKey()
  const ivBytes = Buffer.from(iv, 'base64')

  const authTag = ciphertext.subarray(ciphertext.length - 16)
  const data = ciphertext.subarray(0, ciphertext.length - 16)

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBytes)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(data), decipher.final()])
}