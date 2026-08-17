export type VaultItemType = 'note' | 'document'

export type VaultItem = {
  id: string
  type: VaultItemType
  title: string
  encryptedData: string
  iv: string
  createdAt: Date
  updatedAt: Date
}

export type NotePayload = {
  body: string
}

export type DocumentPayload = {
  s3Key: string
  filename: string
  size: number
  mimeType: string
}

export type AuditLogAction =
  | 'sign_in'
  | 'sign_out'
  | 'note_created'
  | 'note_deleted'
  | 'document_uploaded'
  | 'document_deleted'

export type VaultItemPayload = NotePayload | DocumentPayload