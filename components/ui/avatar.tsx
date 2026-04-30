import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.ComponentProps<"div"> {
  src?: string | null
  name?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  id?: string | null
}

function getAvatarGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  const hue = Math.abs(hash) % 360
  return `linear-gradient(135deg, oklch(0.68 0.22 ${hue}), oklch(0.55 0.18 ${hue + 20}))`
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "size-7 text-[0.625rem]",
  md: "size-10 text-sm",
  lg: "size-20 text-xl",
  xl: "size-40 text-3xl",
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

export function Avatar({ src, name, size = "md", id, className, style, ...props }: AvatarProps) {
  const initials = getInitials(name)
  const safeSrc = React.useMemo(() => {
    if (!src) return null
    try {
      if (src.startsWith("/")) return src
      const parsed = new URL(src, "http://localhost")
      if (parsed.protocol === "blob:" || parsed.protocol === "https:" || parsed.protocol === "http:") {
        return src
      }
      return null
    } catch {
      return null
    }
  }, [src])

  const useGradient = !safeSrc && !!id
  const mergedStyle = useGradient
    ? { background: getAvatarGradient(id!), color: "oklch(0.08 0 0)", ...style }
    : style

  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden",
        "font-semibold font-heading",
        useGradient ? "" : "bg-surface-highest text-primary",
        sizeClasses[size],
        className
      )}
      style={mergedStyle}
      {...props}
    >
      {safeSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeSrc}
          alt={name ?? "Avatar"}
          className="size-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
