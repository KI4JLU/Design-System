import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Pause, Play, Volume1, Volume2 } from "lucide-react";
import { expect } from "storybook/test";
import { Slider } from "./slider";
import { Button } from "./button";
import { Label } from "./label";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "./form";

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

const meta = {
  title: "Components/Slider",
  component: Slider,
  args: {
    defaultValue: [40],
    max: 100,
    step: 1,
    "aria-label": "Wert",
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    disabled: { control: "boolean" },
  },
  // Fail the story test on any axe violation, not just report it.
  parameters: { a11y: { test: "error" } },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Spielwiese: Werte, Schrittweite und Ausrichtung über die Controls. */
export const Playground: Story = {};

const DURATION = 250;

const SeekBarExample = () => {
  const [time, setTime] = useState(83);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label={playing ? "Pause" : "Abspielen"}
        onClick={() => setPlaying(!playing)}
      >
        {playing ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}
      </Button>
      <Slider
        value={[time]}
        onValueChange={([next]) => setTime(next)}
        max={DURATION}
        aria-label="Wiedergabeposition: Vorlesung.mp3"
        getValueText={(v) => `${formatTime(v)} von ${formatTime(DURATION)}`}
      />
      <span className="shrink-0 text-sm text-on-surface-variant tabular-nums">
        {formatTime(time)} / {formatTime(DURATION)}
      </span>
    </div>
  );
};

/**
 * Suchleiste eines Audio-Players (Transkription): ein Daumen, Sekunden als
 * Wert, `getValueText` liefert die gesprochene Zeit („1:23 von 4:10").
 * Pfeiltasten springen eine Sekunde, Bild ↑/↓ zehn, Pos1/Ende an Anfang/Ende.
 */
export const SeekBar: Story = {
  render: () => <SeekBarExample />,
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole("slider", { name: "Wiedergabeposition: Vorlesung.mp3" });
    await expect(thumb).toHaveAttribute("aria-valuetext", "1:23 von 4:10");
    thumb.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(thumb).toHaveAttribute("aria-valuetext", "1:24 von 4:10");
    await expect(canvas.getByText("1:24 / 4:10")).toBeVisible();
  },
};

const VolumeExample = () => {
  const [volume, setVolume] = useState(70);
  return (
    <div className="flex max-w-56 items-center gap-2 text-on-surface-variant">
      <Volume1 aria-hidden className="h-4 w-4 shrink-0" />
      <Slider
        value={[volume]}
        onValueChange={([next]) => setVolume(next)}
        max={100}
        step={5}
        aria-label="Lautstärke"
        getValueText={(v) => `${v} %`}
      />
      <Volume2 aria-hidden className="h-4 w-4 shrink-0" />
    </div>
  );
};

/** Lautstärke: kompakter Regler mit 5-%-Schritten. */
export const Volume: Story = {
  render: () => <VolumeExample />,
};

const SampleWindowExample = () => {
  const [sampleWindow, setSampleWindow] = useState([30, 60]);
  return (
    <div className="flex flex-col gap-2">
      <Label id="sample-window-label">Probefenster</Label>
      <Slider
        value={sampleWindow}
        onValueChange={setSampleWindow}
        max={DURATION}
        minStepsBetweenThumbs={5}
        aria-labelledby="sample-window-label"
        thumbLabels={["Start", "Ende"]}
        getValueText={(v) => formatTime(v)}
      />
      <p className="m-0 text-sm text-on-surface-variant tabular-nums">
        {formatTime(sampleWindow[0])} bis {formatTime(sampleWindow[1])} ({sampleWindow[1] - sampleWindow[0]} s)
      </p>
    </div>
  );
};

/**
 * Bereich mit zwei Daumen: das Probefenster einer Aufnahme für die
 * Sprecherzuordnung. Jeder Daumen braucht einen eigenen Namen
 * (`thumbLabels`); das Label benennt dann die Gruppe.
 */
export const Range: Story = {
  render: () => <SampleWindowExample />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Probefenster" })).toBeInTheDocument();
    await expect(canvas.getByRole("slider", { name: "Start" })).toHaveAttribute(
      "aria-valuetext",
      "0:30",
    );
    await expect(canvas.getByRole("slider", { name: "Ende" })).toHaveAttribute(
      "aria-valuetext",
      "1:00",
    );
  },
};

/** Deaktiviert, z. B. solange keine Aufnahme geladen ist. */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: [30],
    "aria-label": "Wiedergabeposition",
  },
};

/** Mit sichtbarem Label: `aria-labelledby` benennt den einzelnen Daumen. */
export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Label id="speed-label">Wiedergabegeschwindigkeit</Label>
      <Slider
        defaultValue={[1]}
        min={0.5}
        max={2}
        step={0.25}
        aria-labelledby="speed-label"
        getValueText={(v) => `${v.toLocaleString("de-DE")}-fach`}
      />
    </div>
  ),
};

const InFormExample = () => {
  const [speed, setSpeed] = useState([1.75]);
  const error = speed[0] > 1.5 ? "Höchstens 1,5-fach, sonst wird die Sprache unverständlich." : undefined;
  return (
    <FormItem error={error}>
      <FormLabel>Wiedergabegeschwindigkeit</FormLabel>
      <FormControl>
        <Slider
          value={speed}
          onValueChange={setSpeed}
          min={0.5}
          max={2}
          step={0.25}
          getValueText={(v) => `${v.toLocaleString("de-DE")}-fach`}
        />
      </FormControl>
      <FormDescription>Gilt für alle Aufnahmen der Transkription.</FormDescription>
      <FormMessage />
    </FormItem>
  );
};

/**
 * Im Formular: `FormControl` legt Name (`FormLabel`), Beschreibung bzw.
 * Fehler und `aria-invalid` auf den Daumen, denn dort liegt der Fokus.
 */
export const InForm: Story = {
  render: () => <InFormExample />,
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole("slider", { name: "Wiedergabegeschwindigkeit" });
    await expect(thumb).toHaveAttribute("aria-invalid", "true");
    await expect(thumb).toHaveAccessibleDescription(
      "Höchstens 1,5-fach, sonst wird die Sprache unverständlich.",
    );
    thumb.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(thumb).toHaveAttribute("aria-invalid", "false");
    await expect(thumb).toHaveAccessibleDescription("Gilt für alle Aufnahmen der Transkription.");
  },
};

/** Senkrecht: die Höhe kommt vom Elternelement (mindestens 10 rem). */
export const Vertical: Story = {
  args: {
    orientation: "vertical",
    defaultValue: [60],
    "aria-label": "Lautstärke",
  },
  decorators: [
    (Story) => (
      <div className="flex h-48">
        <Story />
      </div>
    ),
  ],
};
