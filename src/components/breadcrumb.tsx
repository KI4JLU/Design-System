import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Breadcrumb — the path to the current page or view. The shadcn `Breadcrumb`
 * (https://ui.shadcn.com/docs/components/breadcrumb), generated with the CLI
 * and normalised onto this library's tokens, imports and German labels.
 *
 * Two ways to use it:
 * - **The full trail** — `Breadcrumb` > `BreadcrumbList` > `BreadcrumbItem`
 *   (`BreadcrumbLink` / `BreadcrumbPage`) with `BreadcrumbSeparator`s between,
 *   for a page inside a hierarchy.
 * - **`BreadcrumbBack`** — the default **back navigation** of a sub-view (a
 *   dialog's second view, a sub-page): one link "‹ Tetris · Mitglieder" above
 *   the title, back to the parent level. Use it instead of a bare ← icon
 *   button (COMPONENT_GUIDELINES.md, "Back navigation").
 */
function Breadcrumb({ "aria-label": ariaLabel = "Navigationspfad", ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label={ariaLabel} data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-sm break-words text-on-surface-variant sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  /** Render the consumer's own link (e.g. a router `Link`) instead of an `<a>`. */
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        "rounded-sm transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        className,
      )}
      {...props}
    />
  );
}

/** The current page: not a link, announced as the current location. */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-on-surface", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  label = "Weitere",
  ...props
}: React.ComponentProps<"span"> & {
  /** Screen-reader text. Default "Weitere". */
  label?: string;
}) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      {/* Only the icon is decorative. shadcn hides the whole span, which also
          silences this label — and a button wrapped around the ellipsis
          (expand the collapsed trail) would then have no name. */}
      <MoreHorizontal className="size-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface BreadcrumbBackLabels {
  /** Accessible name of the `nav` landmark. Default "Navigationspfad". */
  nav: string;
  /** Spoken before the trail: the link is named "Zurück zu Tetris, Mitglieder". Default "Zurück zu". */
  back: string;
}

const DEFAULT_BACK_LABELS: BreadcrumbBackLabels = {
  nav: "Navigationspfad",
  back: "Zurück zu",
};

export interface BreadcrumbBackProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "children" | "type"> {
  /**
   * The parent level's path, outermost first — `["Tetris", "Mitglieder"]` is
   * shown as "‹ Tetris · Mitglieder". The whole trail is one link back to the
   * last segment's level.
   */
  trail: string[];
  /** Navigate to a URL (an `<a>`) instead of handling `onClick` (a `<button>`). */
  href?: string;
  labels?: Partial<BreadcrumbBackLabels>;
}

/**
 * The back navigation of a sub-view: a leading chevron and the trail to the
 * parent level, as one link, in the primary colour. Sits above the view's
 * title (in a `DialogHeader`, before the `DialogTitle`).
 *
 * A dialog that uses it keeps its other exits consistent: "Abbrechen" and a
 * "Fertig" return to the parent view too; only the ✕ closes the dialog.
 */
// The ref is the element actually rendered: a button, or with `href` an anchor.
// A union, so a plain useRef<HTMLButtonElement> (or <HTMLAnchorElement>) fits.
const BreadcrumbBack = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, BreadcrumbBackProps>(
  ({ trail, href, labels: labelOverrides, className, ...props }, ref) => {
    const labels = { ...DEFAULT_BACK_LABELS, ...labelOverrides };
    // The name is set explicitly: assembled from sr-only fragments, the
    // name computation trims each fragment's edge spaces ("Zurück zuTetris").
    // It contains every visible word, so speech input ("Tetris") still matches.
    const name = `${labels.back} ${trail.join(", ")}`;
    const content = (
      <>
        <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{trail.join(" · ")}</span>
      </>
    );
    const linkClass = cn(
      "inline-flex max-w-full items-center gap-1 rounded-sm text-sm font-medium text-primary",
      "underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
      "disabled:pointer-events-none disabled:opacity-60",
      className,
    );
    return (
      <Breadcrumb aria-label={labels.nav}>
        <BreadcrumbList>
          <BreadcrumbItem className="min-w-0">
            {href !== undefined ? (
              <a
                ref={ref as React.Ref<HTMLAnchorElement>}
                href={href}
                aria-label={name}
                data-slot="breadcrumb-back"
                className={linkClass}
                {...(props as React.ComponentPropsWithoutRef<"a">)}
              >
                {content}
              </a>
            ) : (
              <button ref={ref as React.Ref<HTMLButtonElement>} type="button" aria-label={name} data-slot="breadcrumb-back" className={linkClass} {...props}>
                {content}
              </button>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
);
BreadcrumbBack.displayName = "BreadcrumbBack";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  BreadcrumbBack,
};
