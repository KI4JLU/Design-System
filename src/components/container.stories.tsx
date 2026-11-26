import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Container } from "./container";
import { Card } from "./card";
import { Grid } from "./grid";
import { Stack } from "./stack";

const meta = {
  title: "Primitives/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
  argTypes: {
    size: { control: "select", options: ["page", "content", "reading"] },
    asChild: { control: false },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Centered page column: page margins `gutter` (mobile) / `margin-page` (from md).
 * `size` names the role of the page — `page` (page maximum, default),
 * `content` (content column), `reading` (reading column).
 */
export const Playground: Story = {
  args: { size: "page" },
  render: (args) => (
    <Container {...args} className="py-gutter">
      <Card className="p-6">Inhalt — die Ränder kommen vom Container.</Card>
    </Container>
  ),
};

/**
 * The same paragraph in all three widths — deliberately identical text,
 * because a width can only be judged by its content: the same sentences run
 * over 180 characters per line at `page` and over 74 at `reading`.
 */
const prose = (
  <>
    <p className="m-0 text-on-surface">
      Diese Nutzungsbedingungen regeln die Verwendung der Plattform durch
      Angehörige der Justus-Liebig-Universität Gießen. Mit der Anmeldung über den
      JLU-Account erkennen Sie die nachstehenden Bedingungen an. Sie gelten für
      alle Dienste, die über diese Oberfläche erreichbar sind, unabhängig davon,
      ob der Zugriff über die Weboberfläche, eine Programmierschnittstelle oder
      ein eingebettetes Widget erfolgt.
    </p>
    <p className="m-0 text-on-surface">
      Die Nutzung ist ausschließlich für Zwecke der Forschung, der Lehre und der
      Verwaltung zulässig. Eine Weitergabe der Zugangsdaten an Dritte ist
      untersagt; dies gilt auch für Angehörige derselben Einrichtung. Für
      Inhalte, die Sie in die Plattform einstellen, bleiben Sie verantwortlich.
    </p>
  </>
);

/** Metric card — the content for which `page` is the right width. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <Stack gap="sm">
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {label}
        </span>
        <span className="font-stat-lg text-stat-lg text-on-surface">{value}</span>
      </Stack>
    </Card>
  );
}

/** Collection card — the content for which `content` is the right width. */
function CollectionCard({ title, meta }: { title: string; meta: string }) {
  return (
    <Card className="p-4">
      <Stack gap="sm">
        <span className="text-on-surface">{title}</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {meta}
        </span>
      </Stack>
    </Card>
  );
}

function SizeLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-label-sm text-label-sm text-on-surface-variant">
      {children}
    </div>
  );
}

/**
 * The three widths stacked, each with real content: a metric grid at `page`,
 * a collection grid at `content`, running text at `reading` — and the same
 * paragraph in all three, so the line length can be compared. The dashed edge
 * shows the **measure**, i.e. the column width minus the page margins
 * (`px-gutter` / `px-margin-page` from md) — they are part of the width,
 * because `box-sizing: border-box` applies.
 */
function AllSizesBody() {
  return (
    <Stack gap="lg" className="py-gutter">
      <Container size="page" data-testid="size-page">
        <Stack gap="md" className="border border-dashed border-outline-variant">
          <SizeLabel>
            size=&quot;page&quot; — 1440px (--max-width-container-max), Textmaß
            1360px, ~181 Zeichen/Zeile
          </SizeLabel>
          <Grid cols={4} gap="md">
            <Stat label="Wissensbasen" value="24" />
            <Stat label="Anfragen (30 T.)" value="18.402" />
            <Stat label="Dokumente" value="9.117" />
            <Stat label="Ø Antwortzeit" value="1,8 s" />
          </Grid>
          {prose}
        </Stack>
      </Container>

      <Container size="content" data-testid="size-content">
        <Stack gap="md" className="border border-dashed border-outline-variant">
          <SizeLabel>
            size=&quot;content&quot; — 1000px (--max-width-container-content),
            Textmaß 920px, ~121 Zeichen/Zeile
          </SizeLabel>
          <Grid cols={3} gap="md">
            <CollectionCard title="Prüfungsordnungen" meta="412 Dokumente" />
            <CollectionCard title="Studienberatung" meta="88 Dokumente" />
            <CollectionCard title="HRZ-Handbücher" meta="1.204 Dokumente" />
          </Grid>
          {prose}
        </Stack>
      </Container>

      <Container size="reading" data-testid="size-reading">
        <Stack gap="md" className="border border-dashed border-outline-variant">
          <SizeLabel>
            size=&quot;reading&quot; — 672px (--max-width-container-reading),
            Textmaß 592px, ~74 Zeichen/Zeile
          </SizeLabel>
          {prose}
        </Stack>
      </Container>
    </Stack>
  );
}

/**
 * Oracle for all width stories: the **computed** `max-width` from the CSSOM,
 * not the class string. A class check would stay green even if the utility
 * compiled to nothing — exactly the bug a token name without a utility
 * namespace would cause.
 */
async function expectWidths(canvasElement: HTMLElement) {
  const read = (size: string) => {
    const el = canvasElement.querySelector(`[data-testid='size-${size}']`);
    if (!el) throw new Error(`Container ${size} nicht gefunden`);
    return getComputedStyle(el).maxWidth;
  };
  // 1440px: the published page maximum, unchanged since v0.9 — a consumer
  // may write `max-w-container-max` itself.
  await expect(read("page")).toBe("1440px");
  // 1000px: measured at the consumer, not chosen here —
  // `.home-view__grid--main` in JustRAG (web/src/components/HomeView.css:247).
  await expect(read("content")).toBe("1000px");
  // 672px: 42rem at a 16px root size. The same value as Tailwind's
  // `--container-2xl` (`max-w-2xl`), which this width used directly before,
  // and which `AuthLayout width="prose"` pins independently.
  await expect(read("reading")).toBe("672px");
}

export const AllSizes: Story = {
  render: () => <AllSizesBody />,
  play: async ({ canvasElement }) => {
    await expectWidths(canvasElement);
  },
};

/** The same three widths in the dark theme — the width must not change. */
export const AllSizesDark: Story = {
  ...AllSizes,
  globals: { theme: "dark" },
  play: async ({ canvasElement }) => {
    // First proves that the story really runs in the dark theme
    // (`ThemeProvider` is the only writer of `<html data-theme>`).
    await expect(document.documentElement.dataset.theme).toBe("dark");
    await expectWidths(canvasElement);
  },
};

/**
 * **The escape hatch, pinned on purpose — not a recommendation.** The width
 * utility sits on exactly the element `className` flows into, so a class at
 * the call site wins (`cn()` → tailwind-merge resolves the `max-w` conflict).
 * This story exists because that mechanism is the reason for the token
 * syntax: with `max-w-container-content` instead of
 * `max-w-(--max-width-container-content)`, tailwind-merge 3.6.0 **no longer**
 * detects the conflict, keeps both classes, and the CSS order decides. If it
 * turns red, the syntax in `container-variants.ts` has flipped — not the call
 * site.
 *
 * For page widths the right way is still `size`: `layout-only-classname`
 * can't see a `max-w-[1000px]` at the call site (`Container` is not in
 * `DS_CONTROLS`, see `eslint-plugin/index.js`), so it goes unnoticed.
 */
export const CallSiteWidthStillWins: Story = {
  render: () => (
    <Container size="page" className="max-w-3xl py-gutter" data-testid="overridden">
      <Card className="p-6">
        <span className="text-on-surface">
          size=&quot;page&quot; mit className=&quot;max-w-3xl&quot; am Aufrufort.
        </span>
      </Card>
    </Container>
  ),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("[data-testid='overridden']");
    // Oracle: Tailwind's published scale — `max-w-3xl` is
    // `--container-3xl` = 48rem = 768px, resolved by Chromium.
    await expect(getComputedStyle(el!).maxWidth).toBe("768px");
  },
};
