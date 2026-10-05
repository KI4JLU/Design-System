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
  title: "Components/Alert",
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
 * Die fünf Töne. Jeder Status-Ton bringt sein Icon mit (Status nicht nur über
 * Farbe, WCAG 1.4.1); `neutral` hat keins, wie beim Toast — es gibt keinen
 * Status zu signalisieren.
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

/** Der häufigste Fall in der App: eine Zeile, kein Titel. */
export const DescriptionOnly: Story = {
  render: () => (
    <Alert tone="error">
      <AlertDescription>Die Nutzerliste konnte nicht geladen werden.</AlertDescription>
    </Alert>
  ),
};

/**
 * Mit Aktion: DS-Buttons in `AlertAction`, auf eigener Zeile unter dem Text —
 * so wird weder Text noch Button gestaucht. Die Buttons liegen in der normalen
 * Tab-Reihenfolge.
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
 * `onDismiss` rendert einen Schließen-Button („Schließen", per `dismissLabel`
 * überschreibbar). Das Ausblenden übernimmt die Aufrufstelle — und sie setzt
 * den Fokus neu, weil der fokussierte Button mit dem Alert verschwindet.
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
 * In einer Karte: der Alert bringt seine getönte Fläche mit und braucht keine
 * eigene Karte (Ersatz für die Card-+-Badge-Komposition der Transkription).
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
 * Im Formulardialog: die Fehlermeldung nach einem fehlgeschlagenen Speichern
 * steht über den Feldern und wird mit `live="assertive"` sofort angesagt.
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
