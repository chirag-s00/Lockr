import { useEffect, useState } from 'react'

export function PdfPreview({ url }: { url: string }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null

    async function loadPdf() {
      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to load PDF: ${response.status}`)
      }

      const blob = await response.blob()

      objectUrl = URL.createObjectURL(blob)
      setPdfUrl(objectUrl)
    }

    loadPdf().catch(console.error)

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [url])

  if (!pdfUrl) {
    return <p className="text-sm text-muted-foreground">Loading PDF...</p>
  }

  return (
    <iframe
      src={pdfUrl}
      className="w-full h-96 border rounded-lg"
      title="PDF preview"
    />
  )
}