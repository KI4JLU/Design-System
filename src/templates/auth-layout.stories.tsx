import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { KeyRound } from "lucide-react";
import { expect, within } from "storybook/test";
import { AuthLayout } from "./auth-layout";
import { Logo } from "../components/logo";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Stack } from "../components/stack";
import { FormItem, FormLabel, FormControl } from "../components/form";
import * as formStories from "../components/form.stories";

// Portable Stories: das Fehlerzustands-Beispiel der Form-Stories dient als
// Inhalt der Fehler-Variante — kein neu gemockter Formular-Content.
const { WithError: FieldWithError } = composeStories(formStories, {});

const meta = {
  title: "Templates/AuthLayout",
  component: AuthLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AuthLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const brand = <Logo product="App" size="lg" />;

/**
 * Der Standardfall: Single Sign-on über OIDC/Keycloak — ein einziger
 * primärer Button, der zum Identity Provider weiterleitet. Keine lokalen
 * Felder; der Redirect (`window.location`/Router) gehört in die App.
 */
export const SSO: Story = {
  args: {
    title: "Anmelden",
    description: "Mit Ihrem JLU-Account über Single Sign-on.",
  },
  render: (args) => (
    <AuthLayout
      {...args}
      logo={brand}
      footer={
        <span>
          Probleme bei der Anmeldung?{" "}
          <a href="#hilfe" className="underline underline-offset-4 hover:text-on-surface">
            Hilfe zum JLU-Login
          </a>
        </span>
      }
    >
      <Button className="w-full">
        <KeyRound width="1em" height="1em" aria-hidden />
        Mit JLU-Account anmelden
      </Button>
    </AuthLayout>
  ),
};

/**
 * Local accounts (the fallback without SSO): the wordmark over the card,
 * the title as the page's `<h1>` (`headingLevel={1}`), username and password
 * from the form primitives, „Passwort vergessen?", „Anmelden"; under the card
 * the language switch and the legal links. Sample copy from JustRAG.
 *
 * `play` oracles [ARIA]: „Willkommen zurück" is the page's only `<h1>`; the
 * two fields are labelled „Benutzername" and „Passwort" and fill in as
 * username and current password (`autocomplete`); the language switch's name
 * contains its visible text; the footer holds the four legal links.
 */
export const Login: Story = {
  args: {
    title: "Willkommen zurück",
    headingLevel: 1,
    description: "Melde dich an, um auf deine Knowledge Base zuzugreifen",
  },
  render: (args) => (
    <AuthLayout
      {...args}
      logo={<Logo product="RAG" size="lg" />}
      footer={
        <>
          <Button variant="outline" size="icon" type="button" aria-label="DE – Switch to English" title="Switch to English">
            DE
          </Button>
          <nav aria-label="Rechtliches" className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-xs">
            {["Impressum", "Nutzungsbedingungen", "Datenschutz", "Barrierefreiheit"].map((label, i) => (
              <span key={label} className="flex items-center gap-x-2">
                {i > 0 && <span aria-hidden="true">·</span>}
                <a href={`#${label.toLowerCase()}`} className="py-2 hover:text-on-surface">
                  {label}
                </a>
              </span>
            ))}
          </nav>
        </>
      }
    >
      <Stack gap="md">
        <FormItem>
          <FormLabel>Benutzername</FormLabel>
          <FormControl>
            <Input type="text" autoComplete="username" placeholder="Gib deinen Benutzernamen ein" />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Passwort</FormLabel>
          <FormControl>
            <Input type="password" autoComplete="current-password" placeholder="••••••••" />
          </FormControl>
        </FormItem>
        <a href="#passwort" className="self-end text-sm underline underline-offset-4 hover:text-on-surface">
          Passwort vergessen?
        </a>
        <Button type="submit" className="w-full">
          Anmelden
        </Button>
      </Stack>
    </AuthLayout>
  ),
  play: async ({ canvas }) => {
    const headings = canvas.getAllByRole("heading", { level: 1 });
    await expect(headings.map((h) => h.textContent)).toEqual(["Willkommen zurück"]);
    await expect(canvas.getByLabelText("Benutzername")).toHaveAttribute("autocomplete", "username");
    await expect(canvas.getByLabelText("Passwort")).toHaveAttribute("autocomplete", "current-password");
    // Label in name (WCAG 2.5.3): the accessible name contains the visible „DE".
    await expect(canvas.getByRole("button", { name: /^DE – Switch to English$/ })).toHaveTextContent("DE");
    await expect(canvas.getByRole("link", { name: "Passwort vergessen?" })).toBeVisible();
    const legal = within(canvas.getByRole("navigation", { name: "Rechtliches" }));
    await expect(legal.getAllByRole("link").map((l) => l.textContent)).toEqual([
      "Impressum",
      "Nutzungsbedingungen",
      "Datenschutz",
      "Barrierefreiheit",
    ]);
  },
};

/** Fehlerzustand — Feld-Story aus den Form-Stories, im Template platziert. */
export const WithFieldError: Story = {
  args: { title: "Anmelden" },
  render: (args) => (
    <AuthLayout {...args}>
      <Stack gap="md">
        <FieldWithError />
        <Button className="w-full">Erneut versuchen</Button>
      </Stack>
    </AuthLayout>
  ),
};

/**
 * Rechtstext für die `width="prose"`-Stories — bewusst lang, weil genau die
 * Länge der Fall ist, an dem `max-w-md` gescheitert ist. Eine Zahl im Test
 * belegt die Breite; ob der Text darin *lesbar* ist, entscheidet das Auge.
 */
const legalProse = (
  <Stack gap="md">
    <p className="text-on-surface">
      Diese Nutzungsbedingungen regeln die Verwendung der Plattform durch
      Angehörige der Justus-Liebig-Universität Gießen. Mit der Anmeldung über
      den JLU-Account erkennen Sie die nachstehenden Bedingungen an. Sie gelten
      für alle Dienste, die über diese Oberfläche erreichbar sind, unabhängig
      davon, ob der Zugriff über die Weboberfläche, eine Programmierschnittstelle
      oder ein eingebettetes Widget erfolgt.
    </p>
    <p className="text-on-surface">
      Die Nutzung ist ausschließlich für Zwecke der Forschung, der Lehre und der
      Verwaltung zulässig. Eine Weitergabe der Zugangsdaten an Dritte ist
      untersagt; dies gilt auch für Angehörige derselben Einrichtung. Für
      Inhalte, die Sie in die Plattform einstellen, bleiben Sie verantwortlich.
      Personenbezogene Daten dürfen nur in dem Umfang verarbeitet werden, der
      für den jeweiligen Zweck erforderlich ist.
    </p>
    <p className="text-on-surface">
      Die Verfügbarkeit der Dienste wird nicht zugesichert. Wartungsfenster
      werden, soweit planbar, vorab angekündigt. Ein Anspruch auf dauerhafte
      Speicherung eingestellter Inhalte besteht nicht; für die Sicherung Ihrer
      Arbeitsergebnisse sind Sie selbst verantwortlich.
    </p>
    <p className="text-on-surface">
      Bei Verstößen gegen diese Bedingungen kann der Zugang ohne Vorankündigung
      gesperrt werden. Änderungen dieser Bedingungen werden auf dieser Seite
      veröffentlicht; die weitere Nutzung nach einer Änderung gilt als
      Zustimmung. Es gilt das Recht der Bundesrepublik Deutschland.
    </p>
  </Stack>
);

/**
 * Die Breiten-Einschränkung sitzt auf der **inneren** Spalte von
 * `AuthLayout` — das Wurzelelement, in das ein `className` des Aufrufers
 * hineinfließt, trägt keine. Genau deshalb existiert die `width`-Prop. Die
 * Messung muss also dieses eine Element erreichen: das einzige Kind der
 * Wurzel. Die Kopplung an den inneren Aufbau ist hier Absicht — sie ist der
 * Grund für die Prop und wäre von außen nicht messbar.
 */
function readColumn(canvasElement: HTMLElement): Element {
  const root = canvasElement.querySelector("[data-testid='auth-root']");
  const column = root?.firstElementChild;
  if (!column) throw new Error("AuthLayout-Spalte nicht gefunden");
  return column;
}

/**
 * Der Fall, der diese Prop nötig gemacht hat: eine Rechtstext-Seite
 * (Nutzungsbedingungen, Barrierefreiheitserklärung, Datenschutzerklärung) im
 * Auth-Template. `width="prose"` gibt der Spalte 672px statt der 448px eines
 * Anmeldeformulars.
 */
export const LegalPage: Story = {
  args: {
    width: "prose",
    title: "Nutzungsbedingungen",
    description: "Stand: 1. September 2026",
  },
  render: (args) => (
    <AuthLayout
      {...args}
      data-testid="auth-root"
      footer={
        <a href="#impressum" className="underline underline-offset-4 hover:text-on-surface">
          Impressum
        </a>
      }
    >
      {legalProse}
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    // Oracle: Tailwinds veröffentlichte Skala, nicht diese Komponente.
    // `max-w-2xl` ist 42rem, bei der 16px-Wurzelgröße also 672px — die
    // Chromium-CSS-Engine löst das auf, hier wird nur das Ergebnis abgefragt.
    await expect(getComputedStyle(readColumn(canvasElement)).maxWidth).toBe("672px");
  },
};

/**
 * Derselbe Rechtstext in der Standardbreite — **der abgelehnte Zustand**,
 * absichtlich als Story erhalten, damit die beiden Breiten nebeneinander
 * beurteilbar sind. Pinnt gleichzeitig die Standardbreite auf 448px, damit
 * bestehende Anmeldeseiten sich nicht verschieben.
 */
export const LegalPageAtDefaultWidth: Story = {
  args: {
    title: "Nutzungsbedingungen",
    description: "Zum Vergleich: dieselbe Seite ohne width=\"prose\"",
  },
  render: (args) => (
    <AuthLayout {...args} data-testid="auth-root">
      {legalProse}
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    // `max-w-md` = 28rem = 448px, wieder aus Tailwinds Skala.
    await expect(getComputedStyle(readColumn(canvasElement)).maxWidth).toBe("448px");
  },
};

/**
 * **`headingLevel` — der Titel als echte Überschrift.** Ohne die Prop landet
 * `title` in `CardTitle` und ist damit *keine* Überschrift: die Seite hat
 * keinen `<h1>`, es sei denn der Aufrufer bringt einen mit. Das ist der
 * Standard und bleibt es, weil ein Konsument genau deshalb sein eigenes
 * `<h1>`-Element **in** den Slot gibt — ein hier automatisch erzeugtes `<h1>`
 * würde eines im anderen verschachteln.
 *
 * Mit `headingLevel={1}` übernimmt das Template die Überschrift (über
 * `CardTitle asChild`, die Typografie bleibt also dieselbe), und der Aufrufer
 * gibt nur noch Text.
 *
 * This is `SSO` with one more arg, so it reuses that story's body. It stays
 * a separate story because `SSO` has to keep showing the default (no
 * heading), and this `play` function pins the `headingLevel` case.
 */
export const TitleAsHeading: Story = {
  ...SSO,
  args: { ...SSO.args, headingLevel: 1 },
  play: async ({ canvasElement }) => {
    const heading = canvasElement.querySelector("h1");
    await expect(heading).not.toBeNull();
    await expect(heading!.textContent).toBe("Anmelden");
    // Orakel: die Schriftgröße aus tokens.css (`--text-headline-md: 24px`) —
    // sie kommt weiter aus `CardTitle`, nicht aus einer Kopie am Aufrufort.
    await expect(getComputedStyle(heading!).fontSize).toBe("24px");
    await expect(getComputedStyle(heading!).marginTop).toBe("0px");
    // Und die Überschrift ist das Element, das `CardTitle` gestylt hat — nicht
    // ein nacktes `<h1>` in einem zusätzlichen `<div>`. Eine reine
    // Größenmessung kann das nicht unterscheiden (die Größe würde vererbt),
    // deshalb hier ausnahmsweise die Klasse: nur `asChild` bringt sie auf das
    // Überschriften-Element selbst.
    await expect(heading!.className).toContain("font-headline-md");
  },
};
