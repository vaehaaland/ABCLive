'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { CameraIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileAvatarProps {
  userId: string
  initialAvatarUrl?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  editable?: boolean
  className?: string
}

export default function ProfileAvatar({
  userId,
  initialAvatarUrl,
  name,
  size = 'md',
  editable = false,
  className,
}: ProfileAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Bildet er for stort. Maks 2 MB.')
      return
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`

    // Optimistic preview
    const localUrl = URL.createObjectURL(file)
    setAvatarUrl(localUrl)

    startTransition(async () => {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        toast.error('Opplasting feilet: ' + uploadError.message)
        setAvatarUrl(initialAvatarUrl ?? null)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        toast.error('Kunne ikkje lagre profilbilde: ' + updateError.message)
      } else {
        setAvatarUrl(publicUrl)
        toast.success('Profilbilde oppdatert!')
      }
    })

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar src={avatarUrl} name={name} size={size} />
      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full",
              "bg-black/0 hover:bg-black/60 transition-colors group",
              isPending && "opacity-50 cursor-wait"
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
            onChange={handleUpload}
          />
        </>
      )}
    </div>
  )
}
