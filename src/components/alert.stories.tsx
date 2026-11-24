import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { FormControl, FormItem, FormLabel } from "./form";
import { Input } from "./input";

const meta = {
  title: "Components/Feedback/Alert",
  component: Alert,
  parameters: { a11y: { test: "error" } },
  args: {
    tone: "neutral",
    live: "off",
    children: (
      <AlertDescription>
        Die Übersicht konnte nicht geladen werden.
      </AlertDescription>
    ),
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "info", "success", "warning", "error"],
    },
    live: { control: "inline-radio", options: ["off", "polite", "assertive"] },
    children: { control: false },
    icon: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * The five tones. Every status tone brings its icon (status not by color
 * alone, WCAG 1.4.1); `neutral` has none, as with the toast — there is no
 * status to signal.
 */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-stack-sm">
      <Alert tone="neutral">
        <AlertTitle>Wartungsfenster</AlertTitle>
        <AlertDescription>
          Am Samstag zwischen 6 und 8 Uhr ist der Campus nur eingeschränkt erreichbar.
        </AlertDescription>
      </Alert>
      <Alert tone="info">
        <AlertTitle>Lokale Transkription</AlertTitle>
        <AlertDescription>
          Aufnahmen werden auf Servern der JLU verarbeitet und verlassen die Universität nicht.
        </AlertDescription>
      </Alert>
      <Alert tone="success">
        <AlertTitle>Vorlage gespeichert</AlertTitle>
        <AlertDescription>Neue Ordner übernehmen die Struktur ab sofort.</AlertDescription>
      </Alert>
      <Alert tone="warning">
        <AlertTitle>Übersetzer nicht eingerichtet</AlertTitle>
        <AlertDescription>
          Für dieses Modul ist noch kein DeepL-Schlüssel hinterlegt. Bitte wende dich an die
          Administration.
        </AlertDescription>
      </Alert>
      <Alert tone="error">
        <AlertTitle>Anmeldung fehlgeschlagen</AlertTitle>
        <AlertDescription>
          Der Anmeldedienst hat nicht geantwortet. Bitte versuche es in einigen Minuten erneut.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

/** The most common case in the app: one line, no title. */
export const DescriptionOnly: Story = {
  render: () => (
    <Alert tone="error">
      <AlertDescription>Die Nutzerliste konnte nicht geladen werden.</AlertDescription>
    </Alert>
  ),
};

/**
 * With an action: DS buttons in `AlertAction`, on their own line below the
 * text — so neither text nor button is squeezed. The buttons are in the normal
 * tab order.
 */
export const WithAction: Story = {
  render: () => (
    <Alert tone="error">
      <AlertTitle>Transkript konnte nicht geladen werden</AlertTitle>
      <AlertDescription>Die Verbindung zum Transkriptionsdienst wurde unterbrochen.</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm">
          Erneut versuchen
        </Button>
      </AlertAction>
    </Alert>
  ),
};

function DismissibleDemo() {
  const [open, setOpen] = React.useState(true);
  const restore = React.useRef<HTMLButtonElement>(null);
  return open ? (
    <Alert
      tone="warning"
      onDismiss={() => {
        setOpen(false);
        // The focused close button unmounts with the alert — put focus somewhere sensible.
        requestAnimationFrame(() => restore.current?.focus());
      }}
      dismissLabel="Hinweis schließen"
    >
      <AlertDescription>
        Texte und Dokumente werden zur Übersetzung an DeepL übermittelt. Bitte keine
        personenbezogenen Daten eingeben.
      </AlertDescription>
    </Alert>
  ) : (
    <Button ref={restore} variant="outline" size="sm" onClick={() => setOpen(true)}>
      Hinweis wieder anzeigen
    </Button>
  );
}

/**
 * `onDismiss` renders a close button ("Schließen", overridable via
 * `dismissLabel`). The call site does the hiding — and it moves focus,
 * because the focused button disappears with the alert.
 */
export const Dismissible: Story = {
  render: () => <DismissibleDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Hinweis schließen" }));
    await expect(canvas.queryByText(/DeepL/)).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Hinweis wieder anzeigen" }));
    await expect(canvas.getByText(/DeepL/)).toBeVisible();
  },
};

/**
 * In a card: the alert brings its tinted surface and needs no card of its own
 * (replaces the card + badge composition of the transcription view).
 */
export const InCard: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Live-Vorschau</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-stack-md">
        <p className="m-0 text-sm text-on-surface-variant">
          Hier erscheint der erkannte Text, sobald die Aufnahme läuft.
        </p>
        <Alert tone="error" live="assertive">
          <AlertDescription>Der Live-Dienst ist gerade nicht erreichbar.</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  ),
};

/**
 * In a form dialog: the error message after a failed save sits above the
 * fields and is announced immediately with `live="assertive"`.
 */
export const InFormDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Ordnervorlage bearbeiten</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ordnervorlage bearbeiten</DialogTitle>
          <DialogDescription>Neue Ordner übernehmen Name und Struktur.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-stack-md" onSubmit={(e) => e.preventDefault()}>
          <Alert tone="error" live="assertive">
            <AlertDescription>
              Die Vorlage konnte nicht gespeichert werden. Bitte versuche es erneut.
            </AlertDescription>
          </Alert>
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input defaultValue="Seminar Wintersemester" />
            </FormControl>
          </FormItem>
          <DialogFooter>
            <Button type="submit">Speichern</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Ordnervorlage bearbeiten" }));
    const dialog = await within(document.body).findByRole("dialog");
    await expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Die Vorlage konnte nicht gespeichert werden.",
    );
  },
};

/**
 * Banner and pill run title · text on one line; the dot belongs between a
 * title and the text. A banner without a title has its icon right before the
 * text in that line — and no dot after it. Oracle: the computed `::before`
 * content of each description.
 */
export const InlineSeparator: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert tone="info" layout="banner" data-testid="untitled">
        <AlertDescription>Dieses Angebot befindet sich im Testbetrieb.</AlertDescription>
      </Alert>
      <Alert tone="info" layout="banner" data-testid="titled">
        <AlertTitle>Testbetrieb</AlertTitle>
        <AlertDescription>Antworten können Fehler enthalten.</AlertDescription>
      </Alert>
      <Alert tone="warning" layout="pill" data-testid="pill">
        <AlertDescription>Antworten können länger dauern.</AlertDescription>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dot = (text: string) =>
      getComputedStyle(canvas.getByText(text), "::before").content;
    await expect(dot("Dieses Angebot befindet sich im Testbetrieb.")).not.toContain("·");
    await expect(dot("Antworten können Fehler enthalten.")).toContain("·");
    await expect(dot("Antworten können länger dauern.")).not.toContain("·");

    // The banner's icon is centred on the text's first line. Oracle: the
    // line box of the text's first glyph run (a Range over its text node).
    for (const id of ["untitled", "titled"]) {
      const banner = canvas.getByTestId(id);
      const icon = banner.querySelector("svg")!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(banner.querySelector("[data-flow=inline] > div")!.lastElementChild!.firstChild!);
      const line = range.getClientRects()[0];
      await expect(icon.top + icon.height / 2).toBeCloseTo(line.top + line.height / 2, 0);
    }
  },
};
