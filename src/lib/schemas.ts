import { z } from 'zod'

const title = z
  .string()
  .min(1, 'Title is required')
  .max(100, 'Title must be under 100 characters')
  .trim()

export const createNoteSchema = z.object({
  title,
  noteBody: z
    .string()
    .min(1, 'Note body is required')
    .max(50_000, 'Note is too long'),
  type: z.literal('note'),
})

export const deleteNoteSchema = z.object({
  id: z
    .string()
    .min(1, 'ID is required'),
})

export const deleteFileSchema = z.object({
  fileId: z
    .string()
    .min(1, 'File ID is required'),
})

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 