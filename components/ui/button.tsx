import { Slot } from "@radix-ui/react-slot"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Gradient fill — signature primary CTA with glow on hover
        default:
          "bg-gradient-to-r from-primary to-stage-purple-dim text-primary-foreground font-semibold hover:opacity-90 hover:shadow-[0_4px_20px_oklch(0.68_0.26_292_/_0.25)]",
        // Ghost with generous rounding — secondary actions
        secondary:
          "rounded-2xl border border-white/15 bg-transparent text-foreground font-medium hover:bg-surface-highest hover:border-white/25",
        // Subtle surface fill — tertiary inline actions
        outline:
          "border-white/10 bg-surface-high text-foreground hover:bg-surface-highest hover:text-foreground",
        // Nav items — no bg, primary on hover
        ghost:
          "hover:bg-surface-high hover:text-primary aria-expanded:bg-surface-high",
        // Gold text-only — high-value actions like "VIP Access"
        tertiary:
          "text-spotlight-gold hover:text-secondary bg-transparent font-medium",
        // Live / on-air — coral tint for urgent states
        live:
          "bg-live-subtle text-live border border-live/25 font-semibold hover:bg-live/18",
        // Alert-tinted for destructive actions
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-4",
        xl: "h-11 gap-2 px-6 text-base rounded-xl",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : ButtonPrimitive
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
