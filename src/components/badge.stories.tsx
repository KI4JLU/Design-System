import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleCheck, LoaderCircle, TrendingUp, TriangleAlert } from "lucide-react";
import { Badge } from "./badge";

const meta = {
  title: "Components/Feedback/Badge",
  component: Badge,
  args: { children: "Status" },
  argTypes: {
    appearance: { control: "select", options: ["filled", "text"] },
    tone: {
      control: "select",
      options: ["neutral", "primary", "secondary", "success", "warning", "caution", "error", "info"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Filled pills: status labels, KPI deltas. */
export const Filled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral">Entwurf</Badge>
      <Badge tone="primary">Offen</Badge>
      <Badge tone="secondary">Neu</Badge>
      <Badge tone="success">
        <TrendingUp className="text-[14px]" width="1em" height="1em" aria-hidden />
        +14 %
      </Badge>
      <Badge tone="warning">Wartung</Badge>
      <Badge tone="caution">Zurückgezogen</Badge>
      <Badge tone="error">Fehler</Badge>
      <Badge tone="info">Beta</Badge>
    </div>
  ),
};

/**
 * Status dot (`dot`): live/online pills (connection status, channel chips).
 * The dot follows the tone's text color — decorative; the text carries the
 * meaning.
 */
export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge dot tone="success">
        Online
      </Badge>
      <Badge dot tone="neutral">
        Offline
      </Badge>
      <Badge dot tone="info">
        Verbunden
      </Badge>
      <Badge dot appearance="text" tone="success">
        Aktiv
      </Badge>
    </div>
  ),
};

/** Text chips: health checks and meta lines (icon + text in the tone color). */
export const TextAppearance: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <Badge appearance="text" tone="success">
        <CircleCheck className="text-[16px]" width="1em" height="1em" aria-hidden />
        Knowledge-Base verbunden
      </Badge>
      <Badge appearance="text" tone="warning">
        <TriangleAlert className="text-[16px]" width="1em" height="1em" aria-hidden />
        KB nicht gefunden
      </Badge>
      <Badge appearance="text" tone="neutral">
        <LoaderCircle className="animate-spin text-[16px]" width="1em" height="1em" aria-hidden />
        Wird geprüft…
      </Badge>
    </div>
  ),
};
