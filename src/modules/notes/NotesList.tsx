'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, } from '@/components/ui/alert-dialog'

type Note = {
  id: string
  title: string
  body: string
  createdAt: Date
}
type NotesListProps = {
  notes: Note[]
}

export function NotesList({ notes }: NotesListProps) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openEdit(note: Note) {
    setEditingNote(note)
    setEditTitle(note.title)
    setEditBody(note.body)
    setEditError('')
  }

  function closeEdit() {
    setEditingNote(null)
    setEditTitle('')
    setEditBody('')
    setEditError('')
  }

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

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingNote) return
    setEditSaving(true)
    setEditError('')

    const res = await fetch('/api/vault', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingNote.id,
        title: editTitle,
        noteBody: editBody,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setEditError(data.error ?? 'Failed to update note')
      setEditSaving(false)
      return
    }

    setEditSaving(false)
    closeEdit()
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)

    const res = await fetch('/api/vault', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to delete note')
    }

    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="w-full p-6 space-y-8">
      {/* create form */}
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

      {/* notes grid */}
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No notes yet — create one above
        </p>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="border rounded-lg p-4 flex flex-col gap-3 hover:border-foreground/20 transition-colors"
            >
              {/* note content */}
              <div className="flex-1 space-y-1 min-h-0">
                <h2 className="font-medium text-sm leading-tight">
                  {note.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {note.body}
                </p>
              </div>

              {/* date */}
              <p className="text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleDateString()}
              </p>

              {/* actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(note)}
                >
                  Edit
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-500 hover:text-red-600"
                      disabled={deletingId === note.id}
                    >
                      {deletingId === note.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete note</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete{' '}
                        <span className="font-medium text-foreground">
                          {note.title}
                        </span>
                        ? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => handleDelete(note.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* edit modal */}
      <Dialog open={!!editingNote} onOpenChange={open => !open && closeEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <Input
              placeholder="Note title"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Note body"
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={8}
              required
            />
            {editError && (
              <p className="text-sm text-red-500">{editError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEdit}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}