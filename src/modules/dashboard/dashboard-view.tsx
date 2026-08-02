'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { NotePayload } from '@/types/vault'

type Note = {
  id: string
  title: string
  body: string
  createdAt: Date
}

type Document = {
  id: string
  title: string
  filename: string
  size: number
  mimeType: string
  createdAt: Date
}

type DashboardViewProps = {
  email: string
  recentNotes: Note[]
  recentDocuments: Document[]
}

export function DashboardView({
  email,
  recentNotes,
  recentDocuments,
}: DashboardViewProps) {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {email}
        </p>
      </div>

      {/* recent notes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent notes</h2>
          <Link href="/notes">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        {recentNotes.length === 0 ? (
          <div className="border rounded-lg p-4 text-sm text-muted-foreground">
            No notes yet.{' '}
            <Link href="/notes" className="underline">
              Create one
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentNotes.map(note => (
              <div key={note.id} className="border rounded-lg p-4">
                <p className="font-medium text-sm">{note.title}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {note.body}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* recent documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent documents</h2>
          <Link href="/documents">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        {recentDocuments.length === 0 ? (
          <div className="border rounded-lg p-4 text-sm text-muted-foreground">
            No documents yet.{' '}
            <Link href="/documents" className="underline">
              Upload one
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDocuments.map(doc => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{doc.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {doc.filename} · {(doc.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* quick actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Quick actions</h2>
        <div className="flex gap-3">
          <Link href="/notes">
            <Button variant="outline">New note</Button>
          </Link>
          <Link href="/documents">
            <Button variant="outline">Upload document</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}