import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import type { ToastVariant } from "./toast-variants";
import { Button } from "./button";
import { cn } from "../lib/utils";

const meta = {
  title: "Components/Feedback/Toast",
  component: Toast,
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Docs frame: the same provider/viewport as in the app, but the viewport sits
 * **in the flow** (`static`) instead of fixed in the screen corner — otherwise
 * all examples on this page would stack in the same corner. `flex-col` turns
 * the stacking direction back, so the order in the docs example matches the
 * source order.
 */
function DocsToasts({
  children,
  newestOnTop = false,
}: {
  children: React.ReactNode;
  newestOnTop?: boolean;
}) {
  return (
    <ToastProvider>
      <ToastViewport
        className={cn(
          "static w-96 p-0 sm:static sm:p-0",
          !newestOnTop && "flex-col",
        )}
      />
      {children}
    </ToastProvider>
  );
}

/**
 * The five variants. `neutral` is the default and deliberately has no icon —
 * there is no status to signal. All of them here with `duration={Infinity}`,
 * so they stay.
 */
export const Variants: Story = {
  render: () => (
    <DocsToasts>
      <Toast variant="neutral" duration={Infinity}>
        <ToastTitle>Einstellungen übernommen</ToastTitle>
        <ToastClose />
      </Toast>
      <Toast variant="success" duration={Infinity}>
        <ToastTitle>Wissensbasis gespeichert</ToastTitle>
        <ToastClose />
      </Toast>
      <Toast variant="info" duration={Infinity}>
        <ToastTitle>Import gestartet</ToastTitle>
        <ToastDescription>12 Dateien werden verarbeitet.</ToastDescription>
        <ToastClose />
      </Toast>
      <Toast variant="warning" duration={Infinity}>
        <ToastTitle>Kontingent zu 90 % ausgeschöpft</ToastTitle>
        <ToastClose />
      </Toast>
      <Toast variant="error" duration={Infinity}>
        <ToastTitle>Speichern fehlgeschlagen</ToastTitle>
        <ToastDescription>
          Die Verbindung wurde unterbrochen. Bitte erneut versuchen.
        </ToastDescription>
        <ToastClose />
      </Toast>
    </DocsToasts>
  ),
};

/**
 * With an action. The action sits on its own line, not next to the text — the
 * toast is at most `sm` wide, and a button next to it would squeeze text or
 * button (rule 5 of the COMPONENT_GUIDELINES). `altText` is required and is
 * what a screen reader reads **instead of** the label.
 *
 * A toast with an action gets `duration={Infinity}`: an action that clears
 * itself away after four seconds is not usable.
 */
export const WithAction: Story = {
  render: () => (
    <DocsToasts>
      <Toast variant="neutral" duration={Infinity}>
        <ToastTitle>Dokument in den Papierkorb verschoben</ToastTitle>
        <ToastAction altText="Wiederherstellbar im Papierkorb">
          Rückgängig
        </ToastAction>
        <ToastClose />
      </Toast>
      <Toast variant="error" duration={Infinity}>
        <ToastTitle>Upload fehlgeschlagen</ToastTitle>
        <ToastDescription>handbuch-2026.pdf (12,4 MB)</ToastDescription>
        <ToastAction altText="Upload erneut über die Dateiliste starten">
          Erneut versuchen
        </ToastAction>
        <ToastClose />
      </Toast>
    </DocsToasts>
  ),
};

/**
 * Long content wraps; unbreakable strings (IDs, URLs) break inside the word
 * thanks to `wrap-anywhere` instead of bursting the toast. Still: a toast is a
 * message, not an error report — details belong on the page or in a dialog.
 */
export const LongContent: Story = {
  render: () => (
    <DocsToasts>
      <Toast variant="error" duration={Infinity}>
        <ToastTitle>Indizierung abgebrochen</ToastTitle>
        <ToastDescription>
          Der Dienst hat die Verbindung nach 30 Sekunden geschlossen. Die
          bereits verarbeiteten Dokumente bleiben erhalten, der Rest wird beim
          nächsten Lauf nachgeholt. Vorgang:
          urn:jlu:ingest:8f3c1a0e-77bd-4c2b-9a55-1e6c0f2d94ab
        </ToastDescription>
        <ToastClose />
      </Toast>
    </DocsToasts>
  ),
};

/** `icon={false}` suppresses the status icon, `icon={…}` replaces it. */
export const WithoutIcon: Story = {
  render: () => (
    <DocsToasts>
      <Toast variant="success" icon={false} duration={Infinity}>
        <ToastTitle>Ohne Icon — der Text steht bündig links</ToastTitle>
        <ToastClose />
      </Toast>
    </DocsToasts>
  ),
};

type QueuedToast = {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
};

/**
 * The queue belongs to the app, not the design system — just as in JustRAG
 * (`ToastContext.tsx`), including the limit. Here 5; older ones drop off the
 * end.
 */
function useToastQueue(max: number) {
  const [items, setItems] = React.useState<QueuedToast[]>([]);
  const nextId = React.useRef(1);

  const push = React.useCallback(
    (toast: Omit<QueuedToast, "id">) =>
      setItems((prev) => [...prev, { ...toast, id: nextId.current++ }].slice(-max)),
    [max],
  );
  const remove = React.useCallback(
    (id: number) => setItems((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  return { items, push, remove };
}

function StackDemo() {
  const { items, push, remove } = useToastQueue(5);

  return (
    <ToastProvider>
      <div className="flex flex-wrap gap-stack-sm">
        <Button
          variant="outline"
          onClick={() =>
            push({ variant: "success", title: "Wissensbasis gespeichert" })
          }
        >
          Erfolg
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            push({
              variant: "error",
              title: "Speichern fehlgeschlagen",
              description: "Die Verbindung wurde unterbrochen.",
            })
          }
        >
          Fehler
        </Button>
        <Button
          variant="outline"
          onClick={() => push({ variant: "info", title: "Import gestartet" })}
        >
          Info
        </Button>
      </div>
      {items.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          duration={Infinity}
          onOpenChange={(open) => {
            if (!open) remove(toast.id);
          }}
        >
          <ToastTitle>{toast.title}</ToastTitle>
          {toast.description ? (
            <ToastDescription>{toast.description}</ToastDescription>
          ) : null}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

/**
 * The real, fixed viewport at the bottom right (full width at the bottom below
 * `sm`). New toasts appear at the **top** of the stack — the same direction in
 * which Radix assigns the tab order. From the sixth toast on, the oldest drops
 * out; the app sets that limit.
 */
export const Stack: Story = {
  render: () => <StackDemo />,
};

function AutoDismissDemo() {
  const { items, push, remove } = useToastQueue(3);

  return (
    <ToastProvider>
      <div className="flex flex-col items-start gap-stack-sm">
        <Button
          onClick={() =>
            push({
              variant: "success",
              title: `Entwurf gespeichert (${new Date().toLocaleTimeString("de-DE")})`,
            })
          }
        >
          Erfolg (4 s)
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            push({
              variant: "error",
              title: "Speichern fehlgeschlagen",
              description: "Fehler bleibt 6 s statt 4 s stehen.",
            })
          }
        >
          Fehler (6 s)
        </Button>
        <p className="text-on-surface-variant">
          Zeiger auf den Toast halten oder ihn mit F8 / Tab fokussieren — die
          Zeit läuft erst weiter, wenn Zeiger und Fokus ihn wieder verlassen.
        </p>
      </div>
      {items.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onOpenChange={(open) => {
            if (!open) remove(toast.id);
          }}
        >
          <ToastTitle>{toast.title}</ToastTitle>
          {toast.description ? (
            <ToastDescription>{toast.description}</ToastDescription>
          ) : null}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

/**
 * Auto-dismiss with the default durations per variant (success 4 s, error
 * 6 s) and the pause mechanism for WCAG 2.2.1: hover **and** focus stop the
 * clock, and F8 jumps into the viewport by keyboard.
 */
export const AutoDismiss: Story = {
  render: () => <AutoDismissDemo />,
};
