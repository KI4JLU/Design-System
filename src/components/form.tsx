import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/utils";
import { Label } from "./label";

/**
 * Lightweight, accessible form field primitives.
 *
 * Deliberately NOT the react-hook-form-based shadcn Form: the app uses simple
 * controlled inputs, so we avoid pulling in RHF + zod. What this DOES guarantee
 * is the accessibility wiring the plan requires — a `<label htmlFor>` bound to
 * the control, plus `aria-invalid` / `aria-describedby` linking the control to
 * its error and description. Pass the current error string to <FormItem error>.
 *
 * If forms grow to need schema validation, swap the internals for RHF + zod
 * without changing call sites.
 */
interface FormFieldContextValue {
  id: string;
  descriptionId: string;
  messageId: string;
  error?: string;
  /** Rendered id of the mounted FormLabel, so FormControl only references a label that exists. */
  labelId?: string;
  registerLabel: (labelId: string) => () => void;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormField() {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) throw new Error("Form components must be used within <FormItem>");
  return ctx;
}

interface FormItemProps extends React.ComponentProps<"div"> {
  error?: string;
}

function FormItem({ className, error, ...props }: FormItemProps) {
  const id = React.useId();
  const [labelId, setLabelId] = React.useState<string>();
  const registerLabel = React.useCallback((next: string) => {
    setLabelId(next);
    return () => setLabelId((current) => (current === next ? undefined : current));
  }, []);
  const value = React.useMemo<FormFieldContextValue>(
    () => ({
      id,
      descriptionId: `${id}-description`,
      messageId: `${id}-message`,
      error,
      labelId,
      registerLabel,
    }),
    [id, error, labelId, registerLabel],
  );
  return (
    <FormFieldContext.Provider value={value}>
      <div className={cn("flex flex-col gap-1", className)} {...props} />
    </FormFieldContext.Provider>
  );
}

function FormLabel({
  className,
  id: idProp,
  ...props
}: React.ComponentPropsWithoutRef<typeof Label>) {
  const { id, error, registerLabel } = useFormField();
  const labelId = idProp ?? `${id}-label`;
  const ref = React.useRef<React.ComponentRef<typeof Label>>(null);
  // With `asChild` the child's own id wins over `labelId`; register the id that
  // is actually in the DOM so FormControl never points at a missing label.
  const [renderedId, setRenderedId] = React.useState(labelId);
  React.useLayoutEffect(() => {
    const domId = ref.current?.id || labelId;
    if (domId !== renderedId) setRenderedId(domId);
  }, [labelId, renderedId, props.children]);
  React.useLayoutEffect(() => registerLabel(renderedId), [registerLabel, renderedId]);
  return (
    <Label
      ref={ref}
      id={labelId}
      htmlFor={id}
      className={cn(error && "text-error", className)}
      {...props}
    />
  );
}

/**
 * Injects id + aria-* onto its single child control (e.g. <Input>).
 * `aria-labelledby` points at the FormLabel too, which names controls that a
 * `<label for>` cannot (a Slider thumb, any `role`-based widget).
 */
function FormControl({ ...props }: React.ComponentPropsWithoutRef<typeof Slot>) {
  const { id, labelId, descriptionId, messageId, error } = useFormField();
  // A name the consumer gave (aria-label / aria-labelledby on FormControl or
  // its child) wins: `aria-labelledby` would otherwise override `aria-label`.
  const child = React.isValidElement<Record<string, unknown>>(props.children)
    ? props.children.props
    : undefined;
  const named = [props, child].some((p) => p?.["aria-label"] || p?.["aria-labelledby"]);
  return (
    <Slot
      id={id}
      aria-labelledby={named ? undefined : labelId}
      aria-invalid={!!error}
      aria-describedby={error ? messageId : descriptionId}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { descriptionId } = useFormField();
  return (
    <p
      id={descriptionId}
      className={cn("m-0 text-sm text-on-surface-variant", className)}
      {...props}
    />
  );
}

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { messageId, error } = useFormField();
  const body = error ?? children;
  if (!body) return null;
  return (
    <p
      id={messageId}
      role="alert"
      className={cn("m-0 text-sm text-error", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export { FormItem, FormLabel, FormControl, FormDescription, FormMessage };
