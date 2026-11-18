import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { cn } from "../lib/utils"

/**
 * The edge a drawer comes from. Base UI names the gesture that dismisses it
 * (`swipeDirection`); this library names the edge, as the shadcn drawer did.
 */
export type DrawerDirection = "top" | "bottom" | "left" | "right"

const SWIPE_DIRECTION = { top: "up", bottom: "down", left: "left", right: "right" } as const

const DrawerDirectionContext = React.createContext<DrawerDirection>("bottom")

export interface DrawerProps extends Omit<DrawerPrimitive.Root.Props, "swipeDirection" | "children"> {
  /** The edge the drawer comes from. Default: `bottom`. */
  direction?: DrawerDirection
  children?: React.ReactNode
}

/**
 * A panel that slides in from a screen edge and is dismissed by swiping it
 * back, on Base UI's `Drawer` (https://base-ui.com/react/components/drawer):
 * the gesture follows the finger, and `snapPoints` give a bottom sheet its
 * stops (fractions of the viewport height, or `px` / `rem` lengths).
 */
function Drawer({ direction = "bottom", children, ...props }: DrawerProps) {
  return (
    <DrawerDirectionContext.Provider value={direction}>
      <DrawerPrimitive.Root swipeDirection={SWIPE_DIRECTION[direction]} {...props}>
        {children}
      </DrawerPrimitive.Root>
    </DrawerDirectionContext.Provider>
  )
}

/** `asChild` hands the part's behaviour to its one child, as on the Radix-based components. */
type AsChild<P> = Omit<P, "children"> & { asChild?: boolean; children?: React.ReactNode }

function DrawerTrigger({ asChild, children, ...props }: AsChild<DrawerPrimitive.Trigger.Props>) {
  return asChild && React.isValidElement(children) ? (
    <DrawerPrimitive.Trigger data-slot="drawer-trigger" render={children} {...props} />
  ) : (
    <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props}>{children}</DrawerPrimitive.Trigger>
  )
}

function DrawerPortal(props: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({ asChild, children, ...props }: AsChild<DrawerPrimitive.Close.Props>) {
  return asChild && React.isValidElement(children) ? (
    <DrawerPrimitive.Close data-slot="drawer-close" render={children} {...props} />
  ) : (
    <DrawerPrimitive.Close data-slot="drawer-close" {...props}>{children}</DrawerPrimitive.Close>
  )
}

function DrawerOverlay({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        // The scrim fades with the swipe: `--drawer-swipe-progress` runs 0 → 1 as the drawer leaves.
        "fixed inset-0 z-50 min-h-dvh bg-scrim/50 opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[swiping]:duration-0",
        className
      )}
      {...props}
    />
  )
}

// Where the viewport puts the popup, and how the popup sits and moves, per edge.
const VIEWPORT_ALIGN: Record<DrawerDirection, string> = {
  top: "items-start justify-center",
  bottom: "items-end justify-center",
  left: "items-stretch justify-start",
  right: "items-stretch justify-end",
}
const POPUP_EDGE: Record<DrawerDirection, string> = {
  top: "max-h-[80vh] w-full rounded-b-lg border-b [transform:translateY(var(--drawer-swipe-movement-y,0px))] data-[ending-style]:[transform:translateY(-100%)] data-[starting-style]:[transform:translateY(-100%)]",
  // The bottom sheet also carries the snap point: its offset is how far the
  // sheet is slid below its own height, and the same length as bottom
  // padding keeps what it holds above the screen's edge.
  bottom: "max-h-[80vh] w-full rounded-t-lg border-t [padding-bottom:max(0px,calc(var(--drawer-snap-point-offset,0px)_+_var(--drawer-swipe-movement-y,0px)))] [transform:translateY(calc(var(--drawer-snap-point-offset,0px)_+_var(--drawer-swipe-movement-y,0px)))] data-[ending-style]:[transform:translateY(100%)] data-[starting-style]:[transform:translateY(100%)]",
  left: "h-full w-3/4 border-r sm:max-w-sm [transform:translateX(var(--drawer-swipe-movement-x,0px))] data-[ending-style]:[transform:translateX(-100%)] data-[starting-style]:[transform:translateX(-100%)]",
  right: "h-full w-3/4 border-l sm:max-w-sm [transform:translateX(var(--drawer-swipe-movement-x,0px))] data-[ending-style]:[transform:translateX(100%)] data-[starting-style]:[transform:translateX(100%)]",
}

function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
  const direction = React.useContext(DrawerDirectionContext)
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className={cn("fixed inset-0 z-50 flex", VIEWPORT_ALIGN[direction])}
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          data-direction={direction}
          className={cn(
            "group/drawer-content flex min-h-0 flex-col border-outline-variant bg-surface-container-lowest text-on-surface shadow-modal outline-none",
            // Released, the drawer eases to rest; while swiped it follows the finger.
            "transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none data-[swiping]:transition-none",
            POPUP_EDGE[direction],
            className
          )}
          {...props}
        >
          <div aria-hidden="true" className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-outline-variant group-data-[direction=bottom]/drawer-content:block" />
          {children}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[direction=bottom]/drawer-content:text-center group-data-[direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

/**
 * The drawer's scrolling body. Inside a sheet with snap points the gesture
 * on it scrolls, and the rows around it (grip, header) drag the sheet.
 */
function DrawerBody({ className, ...props }: DrawerPrimitive.Content.Props) {
  return (
    <DrawerPrimitive.Content
      data-slot="drawer-body"
      className={cn("min-h-0 flex-1 touch-auto overflow-y-auto overscroll-contain", className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("m-0 font-semibold text-on-surface", className)}
      {...props}
    />
  )
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("m-0 text-sm text-on-surface-variant", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerBody,
  DrawerTitle,
  DrawerDescription,
}
