'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {PdfPreview} from '@/components/PdfPreview'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type Document = {
  id: string
  title: string
  filename: string
  size: number
  mimeType: string
  createdAt: Date
}

export function DocumentsList({ documents }: { documents: Document[] }) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewing, setPreviewing] = useState<{
    url: string
    mimeType: string
  } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)

    const res = await fetch('/api/files', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Upload failed')
      setUploading(false)
      return
    }

    setTitle('')
    setFile(null)
    setUploading(false)
    window.location.reload()
  }

  async function handlePreview(doc: Document) {
    const url = `/api/files/download?fileId=${doc.id}`
    setPreviewing({ url, mimeType: doc.mimeType })
  }

  async function handleDownload(doc: Document) {
    const url = `/api/files/download?fileId=${doc.id}`
    const a = document.createElement('a')
    a.href = url
    a.download = doc.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function handleDelete(doc: Document) {
    setDeletingId(doc.id)

    const res = await fetch('/api/files', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: doc.id }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Delete failed')
      setDeletingId(null)
      return
    }

    setDeletingId(null)
    window.location.reload()
  }

  function closePreview() {
    setPreviewing(null)
  }

  function renderPreview(url: string, mimeType: string) {
    if (mimeType.startsWith('image/')) {
      return (
        <img
          src={url}
          alt="preview"
          className="max-w-full max-h-96 rounded-lg object-contain"
        />
      )
    }
    if (mimeType === 'application/pdf') {
      return (
        <PdfPreview url={url} />
      )
    }
    if (mimeType.startsWith('text/')) {
    return (
      <iframe
        src={url}
        className="w-full h-96 border rounded-lg"
        title="Text preview"
      />
    )
  }
    return (
      <div className="p-4 border rounded-lg text-sm text-muted-foreground">
        Preview not available for this file type.{' '}
        <button
          className="underline"
          onClick={() => {
            const a = document.createElement('a')
            a.href = url
            a.download = ''
            a.click()
          }}
        >
          Download instead
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* upload form */}
      <form onSubmit={handleUpload} className="space-y-3">
        <Input
          placeholder="Document title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <Input
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.md"
          onChange={e => {
          const selected = e.target.files?.[0] ?? null
          if (selected && selected.size > 10 * 1024 * 1024) {
          setError('File must be under 10MB')
          e.target.value = ''
          return
          }
          setError('')
          setFile(selected)
          }}
          required
          />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload document'}
        </Button>
      </form>

      {/* inline preview panel */}
      {previewing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Preview</span>
            <Button variant="ghost" size="sm" onClick={closePreview}>
              Close
            </Button>
          </div>
          {renderPreview(previewing.url, previewing.mimeType)}
        </div>
      )}

      {/* document list */}
      <div className="space-y-3">
        {documents.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No documents yet — upload one above
          </p>
        )}
        {documents.map(doc => (
          <div
            key={doc.id}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{doc.title}</p>
              <p className="text-sm text-muted-foreground">
                {doc.filename} · {(doc.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreview(doc)}
              >
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(doc)}
              >
                Download
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete document</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete{' '}
                      <span className="font-medium text-foreground">
                        {doc.title}
                      </span>
                      ? This permanently removes the file from your vault and
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}