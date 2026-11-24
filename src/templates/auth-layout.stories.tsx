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

// Portable stories: the error-state example from the form stories serves as
// the content of the error variant — no newly mocked form content.
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
 * The standard case: single sign-on via OIDC/Keycloak — a single primary
 * button that redirects to the identity provider. No local fields; the
 * redirect (`window.location`/router) belongs in the app.
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

/** Error state — a field story from the form stories, placed in the template. */
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
 * Legal text for the `width="prose"` stories — deliberately long, because
 * length is exactly the case where `max-w-md` failed. A number in the test
 * proves the width; whether the text in it is *readable* is for the eye to
 * judge.
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
 * The width limit sits on `AuthLayout`'s **inner** column — the root element,
 * which a caller's `className` flows into, has none. That is exactly why the
 * `width` prop exists. The measurement therefore has to reach this one
 * element: the root's only child. Coupling to the inner structure is
 * intentional here — it is the reason for the prop and wouldn't be measurable
 * from outside.
 */
function readColumn(canvasElement: HTMLElement): Element {
  const root = canvasElement.querySelector("[data-testid='auth-root']");
  const column = root?.firstElementChild;
  if (!column) throw new Error("AuthLayout-Spalte nicht gefunden");
  return column;
}

/**
 * The case that made this prop necessary: a legal page (terms of use,
 * accessibility statement, privacy policy) in the auth template.
 * `width="prose"` gives the column 672px instead of a sign-in form's 448px.
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
    // Oracle: Tailwind's published scale, not this component.
    // `max-w-2xl` is 42rem, so 672px at a 16px root size — Chromium's CSS
    // engine resolves it; only the result is queried here.
    await expect(getComputedStyle(readColumn(canvasElement)).maxWidth).toBe("672px");
  },
};

/**
 * The same legal text at the default width — **the rejected state**, kept as
 * a story on purpose so the two widths can be judged side by side. At the
 * same time it pins the default width to 448px, so existing sign-in pages
 * don't shift.
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
    // `max-w-md` = 28rem = 448px, again from Tailwind's scale.
    await expect(getComputedStyle(readColumn(canvasElement)).maxWidth).toBe("448px");
  },
};

/**
 * **`headingLevel` — the title as a real heading.** Without the prop, `title`
 * lands in `CardTitle` and is therefore *not* a heading: the page has no
 * `<h1>` unless the caller brings one. That is the default and stays so,
 * because a consumer puts its own `<h1>` element **into** the slot for exactly
 * that reason — an `<h1>` generated automatically here would nest one inside
 * the other.
 *
 * With `headingLevel={1}` the template takes over the heading (via
 * `CardTitle asChild`, so the typography stays the same), and the caller only
 * passes text.
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
    // Oracle: the font size from tokens.css (`--text-headline-md: 24px`) —
    // it still comes from `CardTitle`, not from a copy at the call site.
    await expect(getComputedStyle(heading!).fontSize).toBe("24px");
    await expect(getComputedStyle(heading!).marginTop).toBe("0px");
    // And the heading is the element `CardTitle` styled — not a bare `<h1>`
    // in an extra `<div>`. A size measurement alone can't tell the two apart
    // (the size would be inherited), so as an exception the class is checked
    // here: only `asChild` puts it on the heading element itself.
    await expect(heading!.className).toContain("font-headline-md");
  },
};
