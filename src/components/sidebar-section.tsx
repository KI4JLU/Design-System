import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";
import { Editable, EditableArea, EditableInput } from "./editable";
import { fieldVariants } from "./field-variants";
import { SortableGroupHandle } from "./sortable";
import { ActionMenu, type ActionMenuItem } from "./action-menu";
import { sidebarSectionButtonClasses } from "./sidebar-section-variants";

export type SidebarSectionButtonProps = Omit<ButtonProps, "variant" | "size"> & {
  /** Hidden until the heading is hovered or focused (default true). */
  reveal?: boolean;
  /** Primary colour, always visible: the control shows a state. */
  active?: boolean;
};

/** An icon control beside a section heading — see `sidebarSectionButtonClasses`. */
const SidebarSectionButton = React.forwardRef<HTMLButtonElement, SidebarSectionButtonProps>(
  ({ reveal, active, className, type = "button", ...props }, ref) => (
    <Button
      ref={ref}
      type={type}
      variant="ghost"
      size="icon"
      data-slot="sidebar-section-button"
      className={cn(sidebarSectionButtonClasses({ reveal, active }), className)}
      {...props}
    />
  ),
);
SidebarSectionButton.displayName = "SidebarSectionButton";

/**
 * A section's name, edited where it stands (`Editable`): Enter or leaving
 * the field saves, Escape keeps the old name; an empty or unchanged name is
 * not saved (`onDone(null)`).
 */
function SectionNameField({
  name,
  label,
  maxLength,
  onDone,
}: {
  name: string;
  label: string;
  maxLength?: number;
  onDone: (name: string | null) => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  // Only the user takes the focus away: a click elsewhere or Tab. The menu
  // the field was opened from hands the focus back to its trigger as it
  // closes — after the field is up — and that must not end the editing.
  const leaving = React.useRef(false);
  React.useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.target !== ref.current) leaving.current = true;
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);
  return (
    <Editable
      defaultValue={name}
      defaultEditing
      maxLength={maxLength}
      onSubmit={(value) => {
        const next = value.trim();
        onDone(next && next !== name ? next : null);
      }}
      onCancel={() => onDone(null)}
      className="block"
    >
      <EditableArea className="block">
        <EditableInput
          ref={ref}
          aria-label={label}
          maxLength={maxLength}
          // The heading's own type, marked as editable like the DS's
          // edit-in-place fields. The outline stands 4px off the field and
          // rounds 4px more than it: less by that offset, it has the rows'
          // radius instead of a pill.
          className={cn(
            fieldVariants({ variant: "editable" }),
            "w-full rounded-[calc(var(--ui-radius-row)-4px)] border-0 py-0 text-[length:inherit] md:text-[length:inherit]",
          )}
          onBlur={(e) => {
            if (leaving.current) return;
            // Not the user's doing: keep editing, and take the focus back
            // once it has settled where the menu put it.
            e.preventDefault();
            setTimeout(() => ref.current?.focus(), 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") leaving.current = true;
            // Enter that confirms an IME candidate is not „save" (keyCode 229
            // covers Safari, which has reset `isComposing` by then).
            if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault();
          }}
        />
      </EditableArea>
    </Editable>
  );
}

export interface SidebarSectionProps extends Omit<React.ComponentProps<"li">, "title"> {
  /** The section's name: its heading, which folds it. */
  label: string;
  /** Whether the rows show (default true). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The section's own menu, as a ⋯ beside the heading (revealed on hover). */
  actions?: ActionMenuItem[];
  /** Accessible name of that ⋯ trigger. Required with `actions`. */
  actionsLabel?: string;
  /** Another control beside the heading (a `SidebarSectionButton`, a filter menu). */
  aside?: React.ReactNode;
  /** The heading is a field holding the name, selected: the name is edited in place. */
  renaming?: boolean;
  /** The editing ended: the new name, or null when it is kept (Escape, empty, unchanged). */
  onRename?: (name: string | null) => void;
  /** Accessible name of the name field. */
  renameLabel?: string;
  /** The longest name the field takes. */
  maxNameLength?: number;
  /** What an open section without rows says ("Hier ist noch nichts"). */
  empty?: React.ReactNode;
}

/**
 * A named, foldable section of a side panel's list ("Angepinnt", a section
 * of the user's own, "Verlauf"): the heading — typeset like `SidebarPanel`'s
 * title — folds the rows below it; controls beside it stay out of sight
 * until the heading is hovered. A list item: sections stand in one `<ul>`
 * (mark it `data-sidebar-card-groups` so the arrow keys run across all rows).
 *
 * The heading is a heading, not a pressed button: no button box, no press
 * scale. Renaming happens in the heading itself (`renaming`), never in a
 * dialog.
 *
 * As the child of a `SortableGroup` (`asChild unstyled`) it is a drop target
 * for rows and, when the group sorts itself, dragged by its heading. States
 * set there: `data-drop-target` — a quiet tint and a
 * hairline, drawn inside the section's box so a scroll edge cannot crop it;
 * `data-dragging` — lifted off the list as one card.
 */
const SidebarSection = React.forwardRef<HTMLLIElement, SidebarSectionProps>(
  (
    {
      label, open = true, onOpenChange, actions, actionsLabel, aside, renaming = false, onRename, renameLabel,
      maxNameLength, empty, className, children, ...props
    },
    ref,
  ) => {
    const hasRows = React.Children.toArray(children).length > 0;
    const heading = (
        <div
        data-slot="sidebar-section-heading"
        className="group/sidebar-section-heading mt-2.5 flex min-h-6 items-center justify-between gap-2 px-2.5"
      >
        <h2 className={cn("m-0 text-[13px] font-medium text-outline", renaming && "min-w-0 flex-1")}>
          {renaming ? (
            <SectionNameField
              name={label}
              label={renameLabel ?? label}
              maxLength={maxNameLength}
              onDone={(name) => onRename?.(name)}
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-auto gap-1 p-0 text-[length:inherit] font-[inherit] text-inherit hover:bg-transparent hover:text-on-surface active:scale-100 [&_svg]:size-3.5"
              aria-expanded={open}
              onClick={() => onOpenChange?.(!open)}
            >
              {label}
              {open ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
            </Button>
          )}
        </h2>
        {aside}
        {actions && actions.length > 0 && (
          <ActionMenu label={actionsLabel ?? label} triggerClassName={sidebarSectionButtonClasses()} actions={actions} />
        )}
      </div>
    );
    return (
      <li
        ref={ref}
        data-slot="sidebar-section"
        className={cn(
          "list-none rounded-[var(--ui-radius-row)] [[data-slot=sidebar-section]+&]:mt-3",
          // The target's tint and hairline, on a layer of their own: it reaches
          // down over the room the rows make (`--sortable-room`), which the
          // section's own box does not grow by.
          "relative data-[drop-target]:after:pointer-events-none data-[drop-target]:after:absolute data-[drop-target]:after:inset-0",
          "data-[drop-target]:after:-bottom-[var(--sortable-room,0px)] data-[drop-target]:after:rounded-[var(--ui-radius-row)]",
          "data-[drop-target]:after:bg-primary/5 data-[drop-target]:after:outline data-[drop-target]:after:outline-1 data-[drop-target]:after:-outline-offset-1 data-[drop-target]:after:outline-primary/35",
          "motion-safe:data-[drop-target]:after:transition-[bottom] data-[drop-target]:after:duration-200",
          "data-[dragging]:cursor-grabbing data-[dragging]:rounded-[var(--ui-radius-box)] data-[dragging]:bg-surface-container data-[dragging]:shadow-[var(--shadow-overlay)] data-[dragging]:outline data-[dragging]:outline-1 data-[dragging]:outline-outline-variant",
          className,
        )}
        {...props}
      >
        {/* Inside a `SortableGroup` that sorts itself, the heading is the
            section's drag handle — not while its name is being typed, where
            a drag selects text. Elsewhere the handle is a pass-through. */}
        {renaming ? (
          heading
        ) : (
          <SortableGroupHandle asChild>{heading}</SortableGroupHandle>
        )}
        {open && !hasRows && empty != null && (
          <p data-slot="sidebar-section-empty" className="m-0 px-2.5 py-1.5 text-[13px] text-outline">
            {empty}
          </p>
        )}
        {open && children}
      </li>
    );
  },
);
SidebarSection.displayName = "SidebarSection";

export interface SidebarCardGroupProps extends React.ComponentProps<"div"> {
  /** The group's label ("Heute", a topic's name): small and grey, in sentence case. */
  label?: React.ReactNode;
}

/** A labelled run of rows inside a section — a day of a history. Wraps a `SidebarCardList`. */
function SidebarCardGroup({ label, className, children, ...props }: SidebarCardGroupProps) {
  return (
    <div data-slot="sidebar-card-group" className={cn("group/sidebar-card-group", className)} {...props}>
      {label != null && label !== "" && (
        <h3 className="m-0 px-2.5 pt-3.5 pb-1 text-xs font-normal text-outline group-first/sidebar-card-group:pt-1">
          {label}
        </h3>
      )}
      {children}
    </div>
  );
}

export interface SidebarCardPreviewProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** The row's full title, which the row itself truncates. */
  title: React.ReactNode;
  /** Short facts under it, one per line; `icon` leads its line. */
  lines?: { icon?: React.ReactNode; text: React.ReactNode }[];
}

/** What a row's `HoverPreview` says: the full title, then a few quiet lines. */
function SidebarCardPreview({ title, lines = [], className, ...props }: SidebarCardPreviewProps) {
  return (
    <div data-slot="sidebar-card-preview" className={cn("flex w-56 flex-col gap-1.5 px-1 py-0.5 text-xs", className)} {...props}>
      <p className="m-0 line-clamp-3 text-sm leading-snug font-medium break-words text-on-surface">{title}</p>
      {lines.map((line, i) => (
        <p key={i} className="m-0 flex items-center gap-1.5 text-on-surface-variant [&>svg]:size-3.5 [&>svg]:shrink-0">
          {line.icon}
          <span className="truncate">{line.text}</span>
        </p>
      ))}
    </div>
  );
}

export { SidebarSection, SidebarSectionButton, SidebarCardGroup, SidebarCardPreview };
