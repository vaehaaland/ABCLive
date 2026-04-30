import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.ComponentProps<"div"> {
  src?: string | null
  name?: string | null
  size?: "sm" | "md" | "lg" | "xl"
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

export function Avatar({ src, name, size = "md", className, ...props }: AvatarProps) {
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

  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden",
        "bg-surface-highest text-primary type-title",
        sizeClasses[size],
        className
      )}
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
