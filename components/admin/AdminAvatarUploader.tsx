'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { CameraIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadAvatar } from '@/app/dashboard/admin/users/actions'
import AvatarCropDialog from '@/components/admin/AvatarCropDialog'

interface Props {
  userId: string
  initialAvatarUrl?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const MAX_SOURCE_BYTES = 10 * 1024 * 1024

export default function AdminAvatarUploader({
  userId,
  initialAvatarUrl,
  name,
  size = 'lg',
  className,
}: Props) {
  const router = useRouter()
  const [url, setUrl] = useState(initialAvatarUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [cropOpen, setCropOpen] = useState(false)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)

    if (file.size > MAX_SOURCE_BYTES) {
      setError('Kjeldebiletet er for stort. Maks 10 MB.')
      return
    }

    setPickedFile(file)
    setCropOpen(true)
  }

  function handleCropped(blob: Blob) {
    const cropped = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })

    const localUrl = URL.createObjectURL(blob)
    const previousUrl = url
    setUrl(localUrl)

    const fd = new FormData()
    fd.append('file', cropped)

    startTransition(async () => {
      const result = await uploadAvatar(userId, fd)
      if (!result.ok) {
        setError(result.error ?? 'Opplasting feila')
        setUrl(previousUrl)
        return
      }
      if (result.avatarUrl) setUrl(result.avatarUrl)
      router.refresh()
    })
  }

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div className="relative inline-block">
        <Avatar src={url} name={name} size={size} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full',
            'bg-black/0 hover:bg-black/60 transition-colors group',
            pending && 'opacity-50 cursor-wait'
          )}
          aria-label="Last opp profilbilde"
        >
          <CameraIcon className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handlePick}
        />
      </div>
      {error && <p className="type-label text-destructive">{error}</p>}

      <AvatarCropDialog
        open={cropOpen}
        onOpenChange={(next) => {
          setCropOpen(next)
          if (!next) setPickedFile(null)
        }}
        file={pickedFile}
        onCropped={handleCropped}
      />
    </div>
  )
}

