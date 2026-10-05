import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: { a11y: { test: "error" } },
  args: { variant: "text", className: "w-64" },
  argTypes: {
    variant: { control: "inline-radio", options: ["text", "block", "circle"] },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Die drei Formen: `text` (eine Zeile in Texthöhe), `block` (Fläche mit
 * Kartenradius), `circle` (Avatar, Icon). Breite und Höhe kommen per
 * `className`.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-stack-lg">
      <div className="flex items-center gap-stack-md text-sm">
        <Skeleton variant="circle" className="size-10" />
        <div className="flex flex-1 flex-col">
          <Skeleton className="w-1/2" />
          <Skeleton className="w-1/3" />
        </div>
      </div>
      <Skeleton variant="block" className="h-32" />
    </div>
  ),
};

/**
 * Ein Absatz aus Textzeilen. Jede Zeile ist genau eine Zeilenhöhe hoch und
 * malt den Balken in ihre Mitte — gestapelt brauchen die Zeilen keinen
 * Abstand und so viel Platz wie der Text, der sie ersetzt. Die Zeilenhöhe
 * kommt aus dem umgebenden Text (`text-sm` hier).
 */
export const Paragraph: Story = {
  render: () => (
    <div className="max-w-md text-sm">
      <Skeleton className="w-full" />
      <Skeleton className="w-full" />
      <Skeleton className="w-11/12" />
      <Skeleton className="w-2/3" />
    </div>
  ),
};

/** Drei Textzeilen neben drei Skelettzeilen: gleiche Höhe, kein Sprung beim Austausch. */
export const MatchesTextHeight: Story = {
  render: () => (
    <div className="grid max-w-2xl grid-cols-2 items-start gap-stack-lg text-base">
      <p data-testid="text" className="m-0">
        Die Aufnahme wurde transkribiert.
        <br />
        Die Zusammenfassung folgt gleich.
        <br />
        Drei Zeilen Text.
      </p>
      <div data-testid="skeleton">
        <Skeleton className="w-full" />
        <Skeleton className="w-5/6" />
        <Skeleton className="w-1/2" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = canvas.getByTestId("text").getBoundingClientRect().height;
    const skeleton = canvas.getByTestId("skeleton").getBoundingClientRect().height;
    await expect(text).toBeGreaterThan(0);
    await expect(Math.abs(text - skeleton)).toBeLessThan(1);
  },
};

const HEADLINES = ["Kernaussagen", "Offene Fragen", "Nächste Schritte"];
const WIDTHS = ["w-full", "w-1/2", "w-2/3"];

/**
 * Ladezustand einer Karte: die Region, die ersetzt wird, trägt
 * `aria-busy="true"`, die Skelette sind `aria-hidden`, und **ein** Status
 * (hier ein `Spinner` mit `label`) sagt, was lädt — außerhalb der
 * `aria-busy`-Region, weil Screenreader Änderungen darin zurückhalten dürfen.
 */
export const CardLoading: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Zusammenfassung</CardTitle>
        <Spinner size="sm" label="Zusammenfassung wird erstellt …" className="text-on-surface-variant" />
      </CardHeader>
      <CardContent aria-busy="true" className="flex flex-col gap-stack-md text-sm">
        {HEADLINES.map((headline, index) => (
          <div key={headline} className="flex flex-col gap-stack-sm">
            <Badge tone="neutral" appearance="text">
              {headline}
            </Badge>
            <div>
              <Skeleton className={WIDTHS[index % 3]} />
              {index % 2 === 0 ? <Skeleton className="w-2/3" /> : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("Zusammenfassung wird erstellt …");
  },
};
