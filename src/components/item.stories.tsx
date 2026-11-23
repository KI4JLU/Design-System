import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronRight, Eye, Star } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";
import { IconTile } from "./icon-tile";
import { Button } from "./button";

const meta = {
  title: "Components/Data Display/Item",
  component: Item,
  argTypes: {
    variant: { control: "select", options: ["default", "outline", "muted"] },
    size: { control: "select", options: ["default", "sm"] },
  },
  args: { variant: "outline", size: "default" },
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

/** shadcn/ui `item`: Medium, Inhalt und Aktionen in einer Zeile. */
export const Playground: Story = {
  render: (args) => (
    <Item {...args} className="max-w-md">
      <ItemMedia variant="icon"><Eye /></ItemMedia>
      <ItemContent>
        <ItemTitle>Dein Zugang: Leser</ItemTitle>
        <ItemDescription>Du stellst Fragen an das Thema und liest die Antworten.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">Öffnen</Button>
      </ItemActions>
    </Item>
  ),
};

/** Mit einer getönten `IconTile` als Medium — ein Hinweis in einem Dialog. */
export const WithIconTile: Story = {
  render: () => (
    <Item variant="muted" className="max-w-md">
      <ItemMedia>
        <IconTile tone="warning" size="lg"><Star /></IconTile>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Du hast bereits Zugang als Leser</ItemTitle>
        <ItemDescription>
          Speichere das Thema als Favorit, dann findest du es auch ohne den Link schnell wieder.
        </ItemDescription>
      </ItemContent>
    </Item>
  ),
};

/** Eine Liste als `ItemGroup`, Einträge als Links (`asChild`). */
export const Group: Story = {
  render: () => (
    <ItemGroup className="max-w-md">
      {["Prüfungsordnung", "Modulhandbuch"].map((name, i) => (
        <div key={name} role="listitem">
          {i > 0 && <ItemSeparator />}
          <Item asChild size="sm">
            <a href="#">
              <ItemContent>
                <ItemTitle>{name}</ItemTitle>
              </ItemContent>
              <ItemActions><ChevronRight className="size-4" aria-hidden /></ItemActions>
            </a>
          </Item>
        </div>
      ))}
    </ItemGroup>
  ),
};
