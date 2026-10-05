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
  register: (part: "description" | "message") => () => void;
}

const FieldsetContext = React.createContext<FieldsetContextValue | null>(null);

function useFieldset(component: string) {
  const ctx = React.useContext(FieldsetContext);
  if (!ctx) throw new Error(`<${component}> must be used within <Fieldset>`);
  return ctx;
}

/** Registers a mounted description/message so the fieldset only points at ids that exist. */
function useRegisterPart(ctx: FieldsetContextValue, part: "description" | "message") {
  const { register } = ctx;
  React.useLayoutEffect(() => register(part), [register, part]);
}

export interface FieldsetProps extends React.ComponentPropsWithoutRef<"fieldset"> {
  /** Marks the whole group invalid: `aria-invalid` + error-coloured legend. */
  error?: boolean;
}

const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ className, error = false, "aria-describedby": describedBy, ...props }, ref) => {
    const id = React.useId();
    const [parts, setParts] = React.useState({ description: 0, message: 0 });
    const register = React.useCallback((part: "description" | "message") => {
      setParts((p) => ({ ...p, [part]: p[part] + 1 }));
      return () => setParts((p) => ({ ...p, [part]: p[part] - 1 }));
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
      [
        describedBy,
        parts.description > 0 && value.descriptionId,
        parts.message > 0 && value.messageId,
      ]
        .filter(Boolean)
        .join(" ") || undefined;

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
>(({ className, ...props }, ref) => {
  const ctx = useFieldset("FieldsetDescription");
  useRegisterPart(ctx, "description");
  return (
    <p
      ref={ref}
      id={ctx.descriptionId}
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
>(({ className, ...props }, ref) => {
  const ctx = useFieldset("FieldsetMessage");
  useRegisterPart(ctx, "message");
  return (
    <p
      ref={ref}
      id={ctx.messageId}
      role="alert"
      className={cn("m-0 text-sm text-error", className)}
      {...props}
    />
  );
});
FieldsetMessageText.displayName = "FieldsetMessageText";

export { Fieldset, FieldsetLegend, FieldsetDescription, FieldsetMessage };
