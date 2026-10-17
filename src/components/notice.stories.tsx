import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Info, Lock, TriangleAlert } from "lucide-react";
import { Notice } from "./notice";

const meta = {
  title: "Components/Notice",
  component: Notice,
  args: {
    tone: "neutral",
    children: "Eigentümer und Admin haben immer alle Rechte. Für Bearbeiter und Leser legst du hier fest, was sie dürfen.",
  },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "info", "warning"] },
    icon: { control: false },
  },
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Ein kurzer, statischer Hinweis mit führendem Icon. */
export const Playground: Story = {
  args: { icon: <Info /> },
};

/**
 * Alle Töne, mit und ohne Icon. `neutral` ist die schlichte Containerfläche,
 * `info` und `warning` die Status-Container. Das Icon ist dekorativ
 * (`aria-hidden`); der Text trägt die Aussage.
 */
export const Tones: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <Notice icon={<Lock />}>Eigentümer und Admin haben immer alle Rechte.</Notice>
      <Notice tone="info" icon={<Info />}>
        Änderungen gelten sofort für alle Mitglieder dieses Themas.
      </Notice>
      <Notice tone="warning" icon={<TriangleAlert />}>
        Leser ohne Download-Recht sehen Quellen nur als Titel.
      </Notice>
      <Notice>Ohne Icon: nur der Text auf der getönten Fläche.</Notice>
    </div>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByText("Eigentümer und Admin haben immer alle Rechte.").closest('[data-slot="notice"]') as HTMLElement;
    // Tinted, and the icon sits on the first text line (16px icon in a 20px slot).
    await expect(getComputedStyle(box).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    const icon = box.querySelector("svg") as SVGElement;
    await expect(icon.getBoundingClientRect().width).toBe(16);
    const tones = canvas
      .getAllByText(/.+/, { selector: '[data-slot="notice"] > div' })
      .map((el) => getComputedStyle(el.parentElement as HTMLElement).backgroundColor);
    // Three tones, three distinct surfaces (the fourth repeats neutral).
    await expect(new Set(tones.slice(0, 3)).size).toBe(3);
  },
};
