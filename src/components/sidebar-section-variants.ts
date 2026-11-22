import { cn } from "../lib/utils";

/**
 * Classes of a control beside a section heading (`SidebarSectionButton`, and
 * the ⋯ trigger of a section's `actions`): a quiet 32px glyph on the row
 * radius, the rows' hover fill, and that same fill while its menu is open —
 * no tinted box. It stands on the axis of the rows' trailing column (the
 * heading row is inset 6px more than the rows) without growing the 24px
 * heading row.
 *
 * `reveal` (default): out of sight until the heading row is hovered or holds
 * focus, or its menu is open; always shown where there is no hover (touch).
 * `active`: always in sight, on the DS's selected fill (`bg-primary/10`, as a
 * selected row or a pressed ghost button) in the primary colour — the
 * control's state is the only sign of something (a filter that hides rows),
 * and a recoloured 16px glyph alone does not read as a state.
 */
export function sidebarSectionButtonClasses({ reveal = true, active = false }: { reveal?: boolean; active?: boolean } = {}) {
  return cn(
    "-my-1 -mr-1.5 size-8 rounded-[var(--ui-radius-row)] hover:text-on-surface",
    "data-[state=open]:bg-hover data-[state=open]:text-on-surface",
    active
      ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary"
      : cn(
          "text-on-surface-variant",
          reveal &&
            "opacity-0 group-focus-within/sidebar-section-heading:opacity-100 group-hover/sidebar-section-heading:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100",
        ),
  );
}
