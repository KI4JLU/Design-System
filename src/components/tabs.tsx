import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../lib/utils";

/**
 * Tab strip + panels, built on Radix — the APG "Tabs" pattern for free:
 * `role="tablist"` on the list, `role="tab"` + `aria-selected` + `aria-controls`
 * on every trigger, `role="tabpanel"` + `aria-labelledby` on the panel, a roving
 * tabindex (only the selected tab is in the tab order) and arrow-key/Home/End
 * navigation inside the strip.
 *
 * **Tabs or SegmentedControl?** Tabs when the strip *names a region of content*:
 * each tab has its own panel and the panel's accessible name is its tab.
 * `SegmentedControl` when the control merely *sets a value* and what changes is
 * data in a region the control does not name (a filtered list, a chart's time
 * range) — that is a `role="group"` of `aria-pressed` toggles, not a tablist.
 * `BottomTabBar` is the third case: app chrome that switches which view the
 * viewport shows, a `navigation` landmark with `aria-current="page"`.
 *
 * Two Radix behaviours worth knowing at the call site, both verified against
 * the installed sources and pinned by `tabs.test.tsx`:
 * - **Inactive panels are unmounted**, not hidden. State inside a panel (a
 *   half-typed form) does not survive a tab switch — lift it to the consumer.
 *   `forceMount` is *not* an escape hatch here: it makes every panel visible at
 *   once rather than mounted-but-hidden.
 * - **Activation is automatic by default**: arrowing onto a tab selects it. Set
 *   `activationMode="manual"` on `Tabs` when a panel is expensive (a fetch per
 *   tab); the tab is then activated with Enter/Space.
 */
const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn(
      "flex flex-col gap-stack-md",
      "data-[orientation=vertical]:flex-row data-[orientation=vertical]:gap-gutter",
      className,
    )}
    {...props}
  />
));
Tabs.displayName = "Tabs";

/**
 * The strip's look. `underline` (default): triggers on a divider, the active
 * one underlined. `segmented`: the triggers share one tinted track and split
 * its width equally; the active one is a raised surface pill — for a few
 * modes of one task inside a dialog (e.g. invite one / many / by link).
 * `enclosed`: separated, flat tabs like a workbook's sheet tabs (SeaTable,
 * Excel) — for many same-kind tabs over one content area, on the panel's own
 * surface. Inactive tabs are light grey boxes (`surface-container-low`, the
 * tone of footers and table headers) on the
 * strip's divider; the active one is the light selection blue
 * (`primary-fixed`, which follows the accent). The divider is an inset line,
 * not a border, so no negative margins are needed and the strip also works
 * inside a clipping (scrolling) container.
 * Only the look differs: all are the same APG tablist. Set on `TabsList`;
 * its triggers read it from context. Horizontal only.
 */
export type TabsListVariant = "underline" | "segmented" | "enclosed";

const TabsVariantContext = React.createContext<TabsListVariant>("underline");

/**
 * The `role="tablist"`. Carries the divider that separates the strip from the
 * panel below (`border-outline-variant`, like every other divider in this
 * system — a bare `border-b` would render in `currentColor`, there is no global
 * border reset here). Radix mirrors the root's orientation onto every part as
 * `data-orientation`, so the vertical strip is a `data-[orientation=vertical]`
 * switch rather than a prop of our own.
 *
 * No built-in scroll container: with many tabs the strip overflows, and
 * `className="overflow-x-auto overflow-y-hidden"` is the (layout-only) call-site
 * recipe — see the „ManyTabs" story.
 */
export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** See `TabsListVariant`. Default `underline`. */
  variant?: TabsListVariant;
}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "underline", ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.List
      ref={ref}
      data-variant={variant}
      className={cn(
        variant === "segmented"
          ? "flex items-center gap-1 rounded-[var(--ui-radius-control)] bg-surface-container-high p-1"
          : variant === "enclosed"
            ? "flex items-end gap-1 shadow-[inset_0_-1px_0_var(--color-outline-variant)]"
            : [
              "flex items-center gap-1 border-b border-outline-variant",
              "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-r",
            ],
        className,
      )}
      {...props}
    />
  </TabsVariantContext.Provider>
));
TabsList.displayName = "TabsList";

/**
 * A single `role="tab"`. The active state is the underline plus `text-primary`
 * — the same "recolor, never resize" rule as `BottomTabBar`, so the strip does
 * not reflow when the selection moves. `shrink-0` + `whitespace-nowrap` keep a
 * label at its stock size (guidelines rule 5): a strip that runs out of room
 * overflows, it does not squeeze its tabs.
 *
 * `disabled` renders a natively disabled `<button>`: Radix drops it from the
 * roving focus order entirely, so arrow keys skip it and it cannot be reached
 * by keyboard at all.
 */
const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex items-center gap-2 whitespace-nowrap px-3 py-2",
        "font-label-sm text-label-sm text-on-surface-variant transition-colors",
        "hover:text-on-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
        "disabled:pointer-events-none disabled:opacity-60",
        "[&_svg]:shrink-0",
        variant === "enclosed"
          ? [
              // Inactive: a grey box on the divider. Active: the light
              // selection blue — recoloured, never resized.
              // h-8: the compact control height, so buttons beside the strip
              // (paging arrows, actions) share its bottom and centre line.
              "h-8 shrink-0 rounded-t-md py-0 bg-surface-container-low",
              "hover:bg-surface-container hover:text-on-surface",
              "data-[state=active]:bg-primary-fixed data-[state=active]:text-on-primary-fixed data-[state=active]:hover:bg-primary-fixed",
            ]
          : variant === "segmented"
          ? [
              // Equal shares of the track where it has room, never below the
              // label's own width (min-width stays auto — controls are never
              // shrunk to fit, guidelines rule 5): a strip too narrow for its
              // labels overflows, like the underline strip (call-site recipe
              // `overflow-x-auto`, see the "SegmentedNarrow" story). The active
              // segment is a raised surface pill, recoloured, never resized.
              "flex-1 justify-center rounded-[calc(var(--ui-radius-control)-4px)]",
              "data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-card",
            ]
          : [
              "-mb-px shrink-0 border-b-2 border-transparent",
              "data-[state=active]:border-primary data-[state=active]:text-primary",
              "data-[orientation=vertical]:-mr-px data-[orientation=vertical]:mb-0 data-[orientation=vertical]:justify-start data-[orientation=vertical]:border-r-2 data-[orientation=vertical]:border-b-0",
            ],
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

/**
 * The `role="tabpanel"`, named by its trigger via `aria-labelledby`. Radix puts
 * `tabIndex={0}` on it — APG asks for that whenever the panel's first piece of
 * content is not itself focusable, and it is kept, so the panel needs a
 * *visible* focus ring (shadcn's template sets `outline-none` and gives nothing
 * back, which would be a WCAG 2.4.7 failure on a focusable element).
 */
const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "min-w-0 flex-1 text-on-surface",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
