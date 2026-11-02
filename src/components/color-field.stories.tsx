import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, screen, userEvent, within } from "storybook/test";
import { Check } from "lucide-react";
import { COLOR_PRESETS } from "../lib/category-color";
import { onColor } from "../lib/legible-color";
import { ColorField } from "./color-field";
import { SettingsRow } from "./settings-dialog";

const meta = {
  title: "Components/ColorField",
  component: ColorField,
} satisfies Meta<typeof ColorField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Eine Farbe als Zeile mit `SettingsRow`: das Raster der Systemfarben, die
 * Browser-Farbwahl nur über „Eigene Farbe…".
 */
export const Row: Story = {
  args: { label: "Farbe", value: "#0056B3", onChange: () => undefined },
  render: () => {
    const [color, setColor] = React.useState("#0056B3");
    return (
      <div className="max-w-md">
        <div className="mb-2 h-12 rounded-xl" style={{ background: color }} />
        <SettingsRow label="Farbe" control={<ColorField label="Farbe" value={color} onChange={setColor} />} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Farbe: #0056B3" }));
    await userEvent.click(await screen.findByRole("button", { name: "#FACF37" }));
    await expect(c.getByRole("button", { name: "Farbe: #FACF37" })).toBeInTheDocument();
  },
};

/** Eine Farbe außerhalb der Palette: „Eigene Farbe…" ist markiert. */
export const Custom: Story = {
  args: { label: "Farbe", value: "#7A3E9D", onChange: () => undefined },
};

/** Die Markierung jeder Systemfarbe (und einer an der Grenze): weiß, solange es 3:1 erreicht, sonst schwarz. */
export const CheckOnPresets: Story = {
  args: { label: "Farbe", value: "#0056B3", onChange: () => undefined },
  render: () => (
    <div className="flex gap-2">
      {[...COLOR_PRESETS, "#31A964"].map((hex) => (
        <span key={hex} className="flex size-8 items-center justify-center rounded-full" style={{ background: hex }}>
          <Check data-testid={hex} aria-hidden="true" className="size-4" style={{ color: onColor(hex) }} />
        </span>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const lum = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const luminance = (hex: string) =>
      [1, 3, 5].map((i, k) => [0.2126, 0.7152, 0.0722][k] * lum(parseInt(hex.slice(i, i + 2), 16) / 255)).reduce((a, b) => a + b);
    // #31A964 sits at the 0.3 luminance limit.
    for (const hex of [...COLOR_PRESETS, "#31A964"]) {
      const channels = getComputedStyle(c.getByTestId(hex)).color.match(/[\d.]+/g)!.map(Number).slice(-3);
      // Oracle: black or white, never a grey in between.
      await expect([[0, 0, 0], [1, 1, 1]]).toContainEqual(channels);
      const white = channels[0] === 1;
      const y = luminance(hex);
      // Oracle: the glyph reaches 3:1 non-text contrast on its swatch.
      await expect(white ? 1.05 / (y + 0.05) : (y + 0.05) / 0.05).toBeGreaterThanOrEqual(3);
    }
  },
};
