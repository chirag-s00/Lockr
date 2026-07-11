'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Note = {
  id: string
  title: string
  body: string
  createdAt: Date
}

export function NotesList({ notes }: { notes: Note[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, noteBody: body, type: 'note' }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to save note')
      setSaving(false)
      return
    }

    setTitle('')
    setBody('')
    setSaving(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    await fetch('/api/vault', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="space-y-3">
        <Input
          placeholder="Note title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <Textarea
          placeholder="Write your secure note..."
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save note'}
        </Button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No notes yet — create one above
          </p>
        )}
        {notes.map(note => (
          <div
            key={note.id}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{note.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(note.id)}
              >
                Delete
              </Button>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {note.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}