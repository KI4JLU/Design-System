import * as React from "react";
import { Container, type ContainerProps } from "../components/container";
import { FormActionBar } from "../components/form-action-bar";
import { PageHeader } from "../components/page-header";
import { Stack } from "../components/stack";
import { cn } from "../lib/utils";
import { type HeadingLevel } from "../lib/heading-level";

/**
 * Template „Formular": narrow single column — PageHeader, the form sections
 * as `children`, and a separated footer row for the primary/secondary
 * actions (right-aligned from sm up, stacked with the primary action first
 * on mobile). The template renders no <form> element: wrap it in your own
 * <form onSubmit=…> so submit buttons in `actions` work naturally.
 *
 * Long forms: `stickyActions` puts the actions into a `FormActionBar` that
 * stays at the bottom of the scroll container, and `size` widens the column
 * beyond the reading measure. Both default to the previous look.
 */
export interface FormLayoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Page title. Rendered as a real heading by `PageHeader`. */
  title: React.ReactNode;
  /**
   * Level of `title` in the document outline, `1`–`6`. Defaults to
   * `PageHeader`'s `1`, i.e. an `<h1>` — unchanged for every existing call
   * site. Pass `2` when this form is a section of a page that already owns
   * the `<h1>`; see `docs/COMPONENT_GUIDELINES.md` → „Page headings: who
   * owns them".
   */
  headingLevel?: HeadingLevel;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /** Footer actions (submit/cancel Buttons). */
  actions?: React.ReactNode;
  /**
   * Render `actions` in a sticky `FormActionBar` (raised bar, pinned to the
   * bottom of the scroll container while the form scrolls) instead of the
   * static row under a rule. Default `false`. Fields also get a bottom
   * `scroll-margin`, so a field reached with Tab is not left behind the bar.
   * For an error or status message beside the actions, pass a
   * `FormActionBar` with `message` as the last child instead of `actions`.
   */
  stickyActions?: boolean;
  /**
   * Column width, as a `Container` size: `reading` (672px, default),
   * `content` (1000px) or `page` (1440px). Wider sizes suit settings forms of
   * many cards; a single column of fields stays at `reading`.
   */
  size?: NonNullable<ContainerProps["size"]>;
}

const FormLayout = React.forwardRef<HTMLDivElement, FormLayoutProps>(
  (
    {
      className,
      title,
      headingLevel,
      description,
      actions,
      stickyActions = false,
      size = "reading",
      children,
      ...props
    },
    ref,
  ) => (
    <Container
      ref={ref}
      size={size}
      className={cn("flex flex-col gap-stack-lg py-gutter md:py-margin-page", className)}
      {...props}
    >
      {/* `headingLevel` is forwarded, not defaulted here: `PageHeader` owns
          the default (1) so there is one place to read it off. */}
      <PageHeader title={title} headingLevel={headingLevel} description={description} />
      {/* The scroll margin keeps a focused field clear of the sticky bar
          (WCAG 2.4.11): taller while the bar stacks its actions on phones. */}
      <Stack
        gap="lg"
        className={cn(stickyActions && "[&_*]:scroll-mb-44 sm:[&_*]:scroll-mb-28")}
      >
        {children}
      </Stack>
      {actions && stickyActions && <FormActionBar>{actions}</FormActionBar>}
      {actions && !stickyActions && (
        <div className="flex flex-col-reverse gap-stack-sm border-t border-outline-variant pt-gutter sm:flex-row sm:justify-end">
          {actions}
        </div>
      )}
    </Container>
  ),
);
FormLayout.displayName = "FormLayout";

export { FormLayout };
