import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { descriptionItemVariants, descriptionListVariants } from "./description-list-variants";

type DescriptionListLayout = NonNullable<VariantProps<typeof descriptionListVariants>["layout"]>;

const DescriptionListContext = React.createContext<DescriptionListLayout>("stacked");

/**
 * Term/value pairs: account details, metadata, settings summaries. A real
 * `<dl>`, so screen readers announce the list and its pairs.
 *
 * Group each pair in a `DescriptionItem` (`<div>` around one `dt` + `dd`,
 * valid HTML): it carries the spacing in `stacked` and joins the columns in
 * `inline`. A term may have several `DescriptionDetails`.
 *
 * `layout`: `stacked` (default) puts the term above its value, which suits
 * narrow panels and dialogs; `inline` puts terms in a left column, values in
 * a right one.
 */
export interface DescriptionListProps
  extends React.HTMLAttributes<HTMLDListElement>,
    VariantProps<typeof descriptionListVariants> {}

const DescriptionList = React.forwardRef<HTMLDListElement, DescriptionListProps>(
  ({ className, layout, ...props }, ref) => {
    const resolved = layout ?? "stacked";
    return (
      <DescriptionListContext.Provider value={resolved}>
        <dl
          ref={ref}
          className={cn(descriptionListVariants({ layout: resolved }), className)}
          {...props}
        />
      </DescriptionListContext.Provider>
    );
  },
);
DescriptionList.displayName = "DescriptionList";

/** One term with its value(s); follows the list's `layout`. */
const DescriptionItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const layout = React.useContext(DescriptionListContext);
    return (
      <div ref={ref} className={cn(descriptionItemVariants({ layout }), className)} {...props} />
    );
  },
);
DescriptionItem.displayName = "DescriptionItem";

/** The term: muted label type (the same as `Label`). */
const DescriptionTerm = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <dt
      ref={ref}
      className={cn(
        "m-0 font-label-sm text-label-sm leading-normal text-on-surface-variant",
        className,
      )}
      {...props}
    />
  ),
);
DescriptionTerm.displayName = "DescriptionTerm";

/** The value: body type. Long unbroken values (e-mail, IDs) wrap instead of overflowing. */
const DescriptionDetails = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <dd
      ref={ref}
      className={cn("m-0 min-w-0 wrap-break-word text-body-base text-on-surface", className)}
      {...props}
    />
  ),
);
DescriptionDetails.displayName = "DescriptionDetails";

export { DescriptionList, DescriptionItem, DescriptionTerm, DescriptionDetails };
