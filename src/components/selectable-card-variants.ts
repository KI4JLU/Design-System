/**
 * The pick target of `SelectableCard`: the `Card` surface as a button. Kept in
 * its own module (see button-variants.ts) so a consumer can give a card-shaped
 * button of its own — an „add" tile beside the cards — the same frame, focus
 * ring and hover without tripping react-refresh's "only export components" rule.
 *
 * Selected: a primary border, a 1px primary ring outside it and a primary
 * tint mixed into the card surface (opaque, so the tint reads the same on any
 * page background). The state comes from the element itself —
 * `data-state=checked` (a radio in a `SelectableCardGroup`) or
 * `aria-pressed=true` (a standalone toggle) — so the classes never depend on
 * props. Keyboard focus draws the strong `focus-ring`, offset from the card.
 */
export const selectableCardClassName = [
  "group/card relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest text-left text-on-surface shadow-card",
  "transition-[border-color,background-color,box-shadow] enabled:hover:border-primary",
  "outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  "data-[state=checked]:border-primary data-[state=checked]:bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-surface-container-lowest))] data-[state=checked]:not-focus-visible:ring-1 data-[state=checked]:not-focus-visible:ring-primary",
  "aria-pressed:border-primary aria-pressed:bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-surface-container-lowest))] aria-pressed:not-focus-visible:ring-1 aria-pressed:not-focus-visible:ring-primary",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");
