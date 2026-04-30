'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { GigFile } from '@/types/database'
import { ExternalLink, FileText, ImageIcon, Loader2, Paperclip, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isImage = (mime: string) => mime.startsWith('image/')
const isPDF = (mime: string) => mime === 'application/pdf'
const isPreviewable = (mime: string) => isImage(mime) || isPDF(mime)

function FileIcon({ mime }: { mime: string }) {
  if (isImage(mime)) return <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
  if (isPDF(mime)) return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
  return <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
}

interface GigFilesSectionProps {
  gigId: string
  isAdmin: boolean
  initialFiles: GigFile[]
}

export default function GigFilesSection({ gigId, isAdmin, initialFiles }: GigFilesSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<GigFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<GigFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!inputRef.current) return
    inputRef.current.value = ''

    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Fila er for stor (maks 10 MB)')
      return
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Filtypen er ikkje støtta')
      return
    }

    setUploading(true)

    const storagePath = `${gigId}/${crypto.randomUUID()}`

    const { error: uploadError } = await supabase.storage
      .from('gig-files')
      .upload(storagePath, file, { contentType: file.type })

    if (uploadError) {
      toast.error(`Opplasting feila: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data: inserted, error: insertError } = await supabase
      .from('gig_files')
      .insert({
        gig_id: gigId,
        uploaded_by: user?.id ?? null,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
      })
      .select()
      .single()

    if (insertError) {
      toast.error('Kunne ikkje lagre filinfo')
      await supabase.storage.from('gig-files').remove([storagePath])
      setUploading(false)
      return
    }

    setFiles((prev) => [inserted, ...prev])
    toast.success(`${file.name} lasta opp`)
    setUploading(false)
  }

  async function handleDownload(file: GigFile) {
    const { data, error } = await supabase.storage
      .from('gig-files')
      .createSignedUrl(file.storage_path, 60, { download: file.file_name })

    if (error || !data?.signedUrl) {
      toast.error('Kunne ikkje opne fila')
      return
    }

    window.open(data.signedUrl, '_blank')
  }

  async function handlePreview(file: GigFile) {
    setLoadingPreviewId(file.id)

    const { data, error } = await supabase.storage
      .from('gig-files')
      .createSignedUrl(file.storage_path, 300)

    if (error || !data?.signedUrl) {
      toast.error('Kunne ikkje opne førehandsvising')
      setLoadingPreviewId(null)
      return
    }

    setPreviewFile(file)
    setPreviewUrl(data.signedUrl)
    setLoadingPreviewId(null)
  }

  async function handleDelete(file: GigFile) {
    setDeletingId(file.id)

    const { error: storageError } = await supabase.storage
      .from('gig-files')
      .remove([file.storage_path])

    if (storageError) {
      toast.error(`Sletting feila: ${storageError.message}`)
      setDeletingId(null)
      return
    }

    const { error: dbError } = await supabase
      .from('gig_files')
      .delete()
      .eq('id', file.id)

    if (dbError) {
      toast.error('Fila vart sletta frå lagring, men ikkje frå databasen')
      router.refresh()
      setDeletingId(null)
      return
    }

    setFiles((prev) => prev.filter((f) => f.id !== file.id))
    toast.success(`${file.file_name} sletta`)
    setDeletingId(null)
  }

  function closePreview() {
    setPreviewFile(null)
    setPreviewUrl(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Vedlegg</CardTitle>
          {isAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {uploading ? 'Lastar opp…' : 'Last opp fil'}
              </Button>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ALLOWED_MIME_TYPES.join(',')}
                onChange={handleUpload}
              />
            </>
          )}
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen vedlegg lasta opp.</p>
          ) : (
            <ul className="divide-y">
              {files.map((file) => (
                <li key={file.id} className="flex items-center justify-between py-2">
                  <button
                    onClick={() => isPreviewable(file.mime_type) ? handlePreview(file) : handleDownload(file)}
                    disabled={loadingPreviewId === file.id}
                    className="flex items-center gap-2 text-left hover:underline min-w-0 disabled:opacity-60"
                  >
                    {loadingPreviewId === file.id
                      ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                      : <FileIcon mime={file.mime_type} />
                    }
                    <span className="text-sm font-medium truncate">{file.file_name}</span>
                    <span className="type-label text-muted-foreground shrink-0">
                      {formatBytes(file.file_size)}
                    </span>
                  </button>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(file)}
                      disabled={deletingId === file.id}
                      aria-label={`Slett ${file.file_name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={previewFile !== null}
        onOpenChange={(open) => { if (!open) closePreview() }}
      >
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewFile?.file_name}</DialogTitle>
          </DialogHeader>

          {previewUrl && previewFile && (
            isImage(previewFile.mime_type)
              ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={previewFile.file_name}
                  className="max-h-[70vh] object-contain mx-auto rounded"
                />
              )
              : (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded border"
                  title={previewFile.file_name}
                />
              )
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => previewUrl && window.open(previewUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Opne i ny fane
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

