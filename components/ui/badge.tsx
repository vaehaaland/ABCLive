import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-[11px] py-0 type-micro tracking-[0.05em] whitespace-nowrap [font-variation-settings:'wght'_650,'opsz'_11,'ROND'_20] transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:       "border-primary/22 bg-primary/12 text-primary shadow-[inset_0_1px_0_oklch(1_0_0_/_0.15),0_1px_6px_oklch(0.63_0.27_305_/_0.20)]",
        secondary:     "border-white/10 bg-surface-high/80 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.08)]",
        destructive:   "border-destructive/22 bg-destructive/12 text-destructive shadow-[inset_0_1px_0_oklch(1_0_0_/_0.15),0_1px_6px_oklch(0.65_0.22_20_/_0.20)]",
        "status-alert":"border-destructive/22 bg-destructive/12 text-destructive shadow-[inset_0_1px_0_oklch(1_0_0_/_0.15),0_1px_6px_oklch(0.65_0.22_20_/_0.20)]",
        success:       "border-success/22 bg-success/12 text-success shadow-[inset_0_1px_0_oklch(1_0_0_/_0.15),0_1px_6px_oklch(0.75_0.18_158_/_0.20)]",
        gold:          "border-spotlight-gold/22 bg-spotlight-gold/12 text-spotlight-gold shadow-[inset_0_1px_0_oklch(1_0_0_/_0.15),0_1px_6px_oklch(0.56_0.14_82_/_0.20)]",
        cold:          "border-spotlight-cold/22 bg-spotlight-cold/12 text-spotlight-cold shadow-[inset_0_1px_0_oklch(1_0_0_/_0.15),0_1px_6px_oklch(0.76_0.18_198_/_0.20)]",
        role:          "border-role-accent/22 bg-role-accent/12 text-role-accent shadow-[inset_0_1px_0_oklch(1_0_0_/_0.15),0_1px_6px_oklch(0.70_0.17_245_/_0.20)]",
        live:          "border-live/22 bg-live-subtle text-live shadow-[inset_0_1px_0_oklch(1_0_0_/_0.15),0_1px_6px_oklch(0.67_0.26_28_/_0.20)]",
        outline:       "border-input bg-surface-container/70 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.08)]",
        ghost:         "text-muted-foreground hover:bg-surface-high hover:text-foreground",
        link:          "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
