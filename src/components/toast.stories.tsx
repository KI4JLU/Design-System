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
 * Doku-Rahmen: derselbe Provider/Viewport wie in der App, aber der Viewport
 * steht **im Fluss** (`static`) statt fixiert in der Bildschirmecke — sonst
 * würden sich alle Beispiele dieser Seite in derselben Ecke stapeln.
 * `flex-col` dreht die Stapelrichtung zurück, damit die Reihenfolge im Doku-
 * Beispiel der Quelltextreihenfolge entspricht.
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
 * Die fünf Varianten. `neutral` ist der Default und trägt bewusst kein Icon —
 * es gibt keinen Status zu signalisieren. Alle hier mit `duration={Infinity}`,
 * damit sie stehen bleiben.
 */
export const Varianten: Story = {
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
 * Mit Aktion. Die Aktion steht auf einer eigenen Zeile, nicht neben dem Text —
 * der Toast ist maximal `sm` breit, ein Button daneben würde Text oder Button
 * stauchen (Regel 5 der COMPONENT_GUIDELINES). `altText` ist Pflicht und ist
 * das, was ein Screenreader **statt** der Beschriftung vorliest.
 *
 * Ein Toast mit Aktion bekommt `duration={Infinity}`: eine Aktion, die sich
 * nach vier Sekunden selbst wegräumt, ist nicht benutzbar.
 */
export const MitAktion: Story = {
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
 * Langer Inhalt bricht um; unteilbare Zeichenketten (IDs, URLs) brechen dank
 * `wrap-anywhere` innerhalb des Wortes, statt den Toast zu sprengen. Trotzdem:
 * ein Toast ist eine Meldung, kein Fehlerbericht — Details gehören auf die
 * Seite oder in ein Dialog.
 */
export const LangerInhalt: Story = {
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

/** `icon={false}` unterdrückt das Status-Icon, `icon={…}` ersetzt es. */
export const OhneIcon: Story = {
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
 * Die Warteschlange gehört der App, nicht dem Design System — genau wie in
 * JustRAG (`ToastContext.tsx`), inklusive Obergrenze. Hier 5, ältere fallen
 * hinten raus.
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
 * Der echte, fixierte Viewport unten rechts (unter `sm` volle Breite unten).
 * Neue Toasts erscheinen **oben** auf dem Stapel — dieselbe Richtung, in der
 * Radix auch die Tab-Reihenfolge vergibt. Ab dem sechsten Toast fällt der
 * älteste heraus; diese Grenze setzt die App.
 */
export const Stapel: Story = {
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
 * Auto-Dismiss mit den Standardzeiten pro Variante (Erfolg 4 s, Fehler 6 s)
 * und dem Pausemechanismus für WCAG 2.2.1: Hover **und** Fokus halten die Uhr
 * an, F8 springt per Tastatur in den Viewport.
 */
export const AutoDismiss: Story = {
  render: () => <AutoDismissDemo />,
};
