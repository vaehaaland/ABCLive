import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border border-transparent bg-clip-padding font-semibold text-sm tracking-[-0.01em] [font-variation-settings:'wght'_650,'opsz'_14,'ROND'_10] transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[oklch(0.67_0.27_305)] to-[oklch(0.52_0.22_305)] text-primary-foreground border-[oklch(0.70_0.27_305_/_0.35)] shadow-[inset_0_1px_0_oklch(1_0_0_/_0.15),0_2px_12px_oklch(0.63_0.27_305_/_0.25)] hover:brightness-105",
        secondary:
          "rounded-2xl border-white/12 bg-surface-container/60 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.08)] backdrop-blur-sm hover:bg-surface-high hover:border-white/18",
        outline:
          "border-white/14 bg-surface-high/80 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.08)] hover:bg-surface-highest hover:text-foreground",
        ghost:
          "hover:bg-surface-high hover:text-primary aria-expanded:bg-surface-high",
        tertiary:
          "text-spotlight-gold hover:text-secondary bg-transparent font-medium",
        live:
          "bg-live text-white border-[oklch(0.55_0.24_28)] shadow-[0_3px_0_oklch(0.42_0.20_28),0_4px_12px_oklch(0.67_0.26_28_/_0.25)] hover:brightness-105",
        destructive:
          "bg-destructive text-white border-[oklch(0.55_0.20_20)] shadow-[0_3px_0_oklch(0.40_0.18_20)] hover:brightness-105",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 rounded-[0.625rem] px-[14px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 rounded-[min(var(--radius-md),10px)] gap-1 px-2 type-label in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 rounded-[0.5rem] gap-1 px-[10px] text-[0.8125rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[38px] rounded-[0.75rem] gap-1.5 px-[18px] text-[0.9375rem]",
        xl: "h-11 rounded-xl gap-2 px-6 text-base",
        icon: "size-8 rounded-[0.625rem]",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[0.5rem] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9 rounded-[0.75rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    loadingText?: string
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      loading = false,
      loadingText = "Loading",
      children,
      disabled,
      type,
      ...props
    },
    ref
  ) => {
    const childArray = React.Children.toArray(children)
    const onlyChild = childArray.length === 1 ? childArray[0] : null
    const canUseAsChild =
      asChild &&
      React.isValidElement(onlyChild) &&
      onlyChild.type !== React.Fragment
    const isDisabled = disabled || loading
    const sharedProps = {
      "data-slot": "button" as const,
      className: cn(buttonVariants({ variant, size, className })),
      "aria-disabled": isDisabled || undefined,
      "aria-busy": loading || undefined,
      "data-loading": loading ? "" : undefined,
      ...props,
    }

    if (canUseAsChild) {
      const child = onlyChild as React.ReactElement<
        { className?: string } & Record<string, unknown>
      >

      return React.cloneElement(
        child,
        {
          ...sharedProps,
          className: cn(sharedProps.className, child.props.className),
        }
      )
    }

    return (
      <button
        type={type ?? "button"}
        {...sharedProps}
        ref={ref}
        disabled={isDisabled}
      >
        {loading ? (
          <>
            <span
              className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden="true"
            />
            <span className="sr-only" aria-live="polite">
              {loadingText}
            </span>
          </>
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
