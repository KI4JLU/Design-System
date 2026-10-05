import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Badge } from "./badge";
import { Card } from "./card";
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from "./description-list";

const meta = {
  title: "Components/DescriptionList",
  component: DescriptionList,
  parameters: { a11y: { test: "error" } },
  args: { layout: "stacked" },
  argTypes: {
    layout: { control: "inline-radio", options: ["stacked", "inline"] },
  },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Die Kontodaten aus den Nutzerdetails der Nutzerverwaltung. */
function UserDetails() {
  return (
    <>
      <DescriptionItem>
        <DescriptionTerm>Name</DescriptionTerm>
        <DescriptionDetails>Maria Musterfrau</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>E-Mail</DescriptionTerm>
        <DescriptionDetails>maria.musterfrau@verwaltung.uni-giessen.de</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Rolle</DescriptionTerm>
        <DescriptionDetails>
          <Badge tone="primary">Admin</Badge>
        </DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Erstellt am</DescriptionTerm>
        <DescriptionDetails>
          <time dateTime="2026-04-14T09:12:00Z">14.04.2026, 11:12</time>
        </DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Letzte Anmeldung</DescriptionTerm>
        <DescriptionDetails>
          <time dateTime="2026-10-05T07:48:00Z">05.10.2026, 09:48</time>
        </DescriptionDetails>
      </DescriptionItem>
    </>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Card className="max-w-md p-6">
      <DescriptionList {...args}>
        <UserDetails />
      </DescriptionList>
    </Card>
  ),
};

/**
 * `stacked` (Standard): Begriff über dem Wert — für schmale Spalten und
 * Dialoge wie die Nutzerdetails.
 */
export const Stacked: Story = {
  render: () => (
    <Card className="max-w-sm p-6">
      <DescriptionList>
        <UserDetails />
      </DescriptionList>
    </Card>
  ),
};

/**
 * `inline`: Begriffe links, Werte rechts. Die Begriffsspalte nimmt den
 * längsten Begriff auf (höchstens 40 %), lange Werte brechen um.
 */
export const Inline: Story = {
  render: () => (
    <Card className="max-w-lg p-6">
      <DescriptionList layout="inline">
        <UserDetails />
      </DescriptionList>
    </Card>
  ),
  // Every value starts on the same vertical line, right of every term.
  play: async ({ canvasElement }) => {
    const terms = [...canvasElement.querySelectorAll("dt")].map((el) => el.getBoundingClientRect());
    const values = [...canvasElement.querySelectorAll("dd")].map((el) => el.getBoundingClientRect());
    const valueLeft = values[0].left;
    for (const value of values) expect(Math.abs(value.left - valueLeft)).toBeLessThan(1);
    for (const term of terms) expect(term.right).toBeLessThanOrEqual(valueLeft);
  },
};

/** Ein Begriff mit mehreren Werten: jeder `DescriptionDetails` bleibt in der Wertspalte. */
export const MultipleValues: Story = {
  render: () => (
    <Card className="max-w-lg p-6">
      <DescriptionList layout="inline">
        <DescriptionItem>
          <DescriptionTerm>Keycloak-Gruppen</DescriptionTerm>
          <DescriptionDetails>/hrz/ki-team</DescriptionDetails>
          <DescriptionDetails>/hrz/mitarbeitende</DescriptionDetails>
        </DescriptionItem>
        <DescriptionItem>
          <DescriptionTerm>Letzte Anmeldung</DescriptionTerm>
          <DescriptionDetails>Noch nie</DescriptionDetails>
        </DescriptionItem>
      </DescriptionList>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const [first, second, third] = [...canvasElement.querySelectorAll("dd")].map((el) =>
      el.getBoundingClientRect(),
    );
    expect(Math.abs(second.left - first.left)).toBeLessThan(1);
    expect(second.top).toBeGreaterThan(first.top);
    expect(Math.abs(third.left - first.left)).toBeLessThan(1);
  },
};

/**
 * Schmales Panel mit einem langen zusammengesetzten Begriff: die
 * Begriffsspalte bleibt bei höchstens 40 % und bricht den Begriff um, statt
 * die Wertspalte wegzudrücken.
 */
export const InlineNarrow: Story = {
  render: () => (
    <Card className="w-72 p-4">
      <DescriptionList layout="inline">
        <DescriptionItem>
          <DescriptionTerm>Datenschutzgrundverordnungskonformitätsprüfung</DescriptionTerm>
          <DescriptionDetails>Bestanden am 02.10.2026</DescriptionDetails>
        </DescriptionItem>
        <DescriptionItem>
          <DescriptionTerm>Rolle</DescriptionTerm>
          <DescriptionDetails>Admin</DescriptionDetails>
        </DescriptionItem>
      </DescriptionList>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("dl")!;
    const listBox = list.getBoundingClientRect();
    const [term] = canvasElement.querySelectorAll("dt");
    const termBox = term.getBoundingClientRect();
    const valueBox = canvasElement.querySelector("dd")!.getBoundingClientRect();
    expect(termBox.width).toBeLessThanOrEqual(listBox.width * 0.4 + 1);
    expect(term.scrollWidth).toBeLessThanOrEqual(term.clientWidth);
    expect(termBox.right).toBeLessThanOrEqual(valueBox.left);
    expect(valueBox.width).toBeGreaterThan(listBox.width * 0.5);
    expect(valueBox.right).toBeLessThanOrEqual(listBox.right + 1);
  },
};
