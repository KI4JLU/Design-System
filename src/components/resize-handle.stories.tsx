import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ResizeHandle } from "./resize-handle";
import { SidePanel } from "./side-panel";

const MIN = 150;
const MAX = 600;

const meta = {
  title: "Primitives/ResizeHandle",
  component: ResizeHandle,
  args: {
    side: "left",
    value: 320,
    min: MIN,
    max: MAX,
    step: 10,
    label: "Breite der Verlaufsleiste ändern",
    onValueChange: () => {},
  },
  argTypes: {
    onValueChange: { control: false },
    onResizeStart: { control: false },
    onResizeEnd: { control: false },
  },
} satisfies Meta<typeof ResizeHandle>;

export default meta;
type Story = StoryObj<typeof meta>;

const Pane = ({ label, width, id }: { label: string; width?: number; id?: string }) => (
  <div
    id={id}
    style={width ? { width } : undefined}
    className="flex flex-1 shrink-0 items-center justify-center bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant"
  >
    {label}
  </div>
);

const SingleHandle = ({ side }: { side: "left" | "right" }) => {
  const [width, setWidth] = useState(320);
  // `controls` points at the pane being resized — the APG splitter's
  // `aria-controls`. Standalone the consumer provides the id; in
  // `AppShellLayout` the wiring is built in.
  const paneId = `resize-handle-story-${side}`;
  const pane = <Pane id={paneId} label={`${width}px`} width={width} />;
  return (
    <div className="flex h-80 overflow-hidden rounded-xl border border-outline-variant bg-surface">
      {side === "left" ? pane : <Pane label="Inhalt" />}
      <ResizeHandle
        side={side}
        value={width}
        min={MIN}
        max={MAX}
        label="Breite ändern"
        controls={paneId}
        onValueChange={setWidth}
      />
      {side === "left" ? <Pane label="Inhalt" /> : pane}
    </div>
  );
};

/**
 * Ziehen mit der Maus **und** Tastatur: ←/→ (und ↑/↓ als Alias) um `step`,
 * Home/End auf `min`/`max`. Die Richtung hängt an `side` — die linke Leiste
 * wächst mit → bzw. ↑, die rechte mit ← bzw. ↓. Den Zieh-Vorgang besitzt die
 * Komponente, den Wert der Konsument.
 */
export const Playground: Story = {
  render: () => <SingleHandle side="left" />,
};

/** Rechte Leiste: gespiegelte Richtung, gleicher Wertebereich. */
export const RightPane: Story = {
  render: () => <SingleHandle side="right" />,
};

const TwoPanes = () => {
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex h-120 overflow-hidden rounded-xl border border-outline-variant bg-surface">
      <SidePanel
        id="panes-story-verlauf"
        side="left"
        isOpen={leftOpen}
        width={leftWidth}
        onExpand={() => setLeftOpen(true)}
        onCollapse={() => setLeftOpen(false)}
        expandLabel="Verlauf ausklappen"
        collapseLabel="Verlauf einklappen"
        aria-label="Verlauf"
      >
        <div className="flex flex-1 items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
          Verlauf · {leftWidth}px
        </div>
      </SidePanel>
      {leftOpen && (
        <ResizeHandle
          side="left"
          value={leftWidth}
          min={MIN}
          max={MAX}
          label="Breite der Verlaufsleiste ändern"
          controls="panes-story-verlauf"
          onValueChange={setLeftWidth}
        />
      )}

      <Pane label="Chat" />

      {rightOpen && (
        <ResizeHandle
          side="right"
          value={rightWidth}
          min={MIN}
          max={MAX}
          label="Breite der Quellenleiste ändern"
          controls="panes-story-quellen"
          onValueChange={setRightWidth}
        />
      )}
      <SidePanel
        id="panes-story-quellen"
        side="right"
        isOpen={rightOpen}
        width={rightWidth}
        onExpand={() => setRightOpen(true)}
        onCollapse={() => setRightOpen(false)}
        expandLabel="Quellen ausklappen"
        collapseLabel="Quellen einklappen"
        aria-label="Quellen"
      >
        <div className="flex flex-1 items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
          Quellen · {rightWidth}px
        </div>
      </SidePanel>
    </div>
  );
};

/**
 * Zusammenspiel beider Primitive: zwei `SidePanel` mit je einem
 * `ResizeHandle`. Jede Leiste zeichnet genau **eine** Randlinie (über `side`),
 * das Handle zeichnet keine — deshalb gibt es hier keine doppelten 1px-Linien
 * und keine negativen Margins. Das Zusammensetzen zu einer Seite ist Aufgabe
 * von `AppShellLayout`, nicht dieser Story.
 */
export const BetweenTwoPanes: Story = {
  render: () => <TwoPanes />,
};
