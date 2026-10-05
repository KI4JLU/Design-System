import * as React from "react";
import { cn } from "../lib/utils";

/**
 * A group of fields under one legend — the group counterpart of `FormItem`
 * (which wires a single control). `Fieldset` renders a native `<fieldset>`:
 * the legend names the group, `disabled` disables every native control
 * inside, and the context wires `aria-describedby` (description + message)
 * and `aria-invalid` (when `error`) onto the fieldset itself.
 */
interface FieldsetContextValue {
  legendId: string;
  descriptionId: string;
  messageId: string;
  error: boolean;
  register: (part: FieldsetPart, partId: string) => () => void;
}

type FieldsetPart = "description" | "message";

const FieldsetContext = React.createContext<FieldsetContextValue | null>(null);

function useFieldset(component: string) {
  const ctx = React.useContext(FieldsetContext);
  if (!ctx) throw new Error(`<${component}> must be used within <Fieldset>`);
  return ctx;
}

/**
 * Registers a mounted description/message under the id it actually renders
 * (a custom `id` wins over the generated one), so the fieldset's
 * `aria-describedby` only points at ids that exist.
 */
function useRegisterPart(ctx: FieldsetContextValue, part: FieldsetPart, partId: string) {
  const { register } = ctx;
  React.useLayoutEffect(() => register(part, partId), [register, part, partId]);
}

export interface FieldsetProps extends React.ComponentPropsWithoutRef<"fieldset"> {
  /** Marks the whole group invalid: `aria-invalid` + error-coloured legend. */
  error?: boolean;
}

const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ className, error = false, "aria-describedby": describedBy, ...props }, ref) => {
    const id = React.useId();
    const [parts, setParts] = React.useState<Record<FieldsetPart, string[]>>({
      description: [],
      message: [],
    });
    const register = React.useCallback((part: FieldsetPart, partId: string) => {
      setParts((p) => ({ ...p, [part]: [...p[part], partId] }));
      return () =>
        setParts((p) => {
          const ids = [...p[part]];
          const index = ids.indexOf(partId);
          if (index !== -1) ids.splice(index, 1);
          return { ...p, [part]: ids };
        });
    }, []);
    const value = React.useMemo<FieldsetContextValue>(
      () => ({
        legendId: `${id}-legend`,
        descriptionId: `${id}-description`,
        messageId: `${id}-message`,
        error,
        register,
      }),
      [id, error, register],
    );
    const ariaDescribedBy =
      [...new Set([describedBy, ...parts.description, ...parts.message].filter(Boolean))].join(
        " ",
      ) || undefined;

    return (
      <FieldsetContext.Provider value={value}>
        <fieldset
          ref={ref}
          aria-invalid={error || undefined}
          aria-describedby={ariaDescribedBy}
          className={cn("group/fieldset m-0 flex min-w-0 flex-col gap-2 border-0 p-0", className)}
          {...props}
        />
      </FieldsetContext.Provider>
    );
  },
);
Fieldset.displayName = "Fieldset";

/** The group's name. Label typography; error colour when the fieldset has an error. */
const FieldsetLegend = React.forwardRef<
  HTMLLegendElement,
  React.ComponentPropsWithoutRef<"legend">
>(({ className, id, ...props }, ref) => {
  const { legendId, error } = useFieldset("FieldsetLegend");
  return (
    <legend
      ref={ref}
      id={id ?? legendId}
      className={cn(
        "mb-2 p-0 font-label-sm text-label-sm text-on-surface-variant",
        "group-disabled/fieldset:cursor-not-allowed group-disabled/fieldset:opacity-60",
        error && "text-error",
        className,
      )}
      {...props}
    />
  );
});
FieldsetLegend.displayName = "FieldsetLegend";

const FieldsetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, id, ...props }, ref) => {
  const ctx = useFieldset("FieldsetDescription");
  const partId = id ?? ctx.descriptionId;
  useRegisterPart(ctx, "description", partId);
  return (
    <p
      ref={ref}
      id={partId}
      className={cn("m-0 text-sm text-on-surface-variant", className)}
      {...props}
    />
  );
});
FieldsetDescription.displayName = "FieldsetDescription";

/** The group's error text. Renders nothing without children. */
const FieldsetMessage = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ children, ...props }, ref) => {
  if (!children) return null;
  return (
    <FieldsetMessageText ref={ref} {...props}>
      {children}
    </FieldsetMessageText>
  );
});
FieldsetMessage.displayName = "FieldsetMessage";

const FieldsetMessageText = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, id, ...props }, ref) => {
  const ctx = useFieldset("FieldsetMessage");
  const partId = id ?? ctx.messageId;
  useRegisterPart(ctx, "message", partId);
  return (
    <p
      ref={ref}
      id={partId}
      role="alert"
      className={cn("m-0 text-sm text-error", className)}
      {...props}
    />
  );
});
FieldsetMessageText.displayName = "FieldsetMessageText";

export { Fieldset, FieldsetLegend, FieldsetDescription, FieldsetMessage };
