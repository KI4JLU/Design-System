import { useLayoutEffect, useState, type ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShellSidePanel } from "../../components/app-shell";
import { Button } from "../../components/button";
import { ChatStage } from "../../components/chat-stage";
import { Logo } from "../../components/logo";
import * as chatStageStories from "../../components/chat-stage.stories";

/* ---------------------------------------------------------------------------
 * Helpers shared by the shell's story pages — `Templates/AppShellLayout`,
 * `Templates/Mobile Shell`, `Templates/Settings` and `Native shell/Frame` all
 * render the same `AppShellLayout` (through `AppShellFixture`) and measure it
 * the same way. Not part of the package: `src/test` is excluded from the type
 * build.
 * ------------------------------------------------------------------------- */

/**
 * Die Chrome-Zeile selbst: das `banner`-Landmark der Shell. Über die Rolle
 * gesucht und nicht über eine Klasse — `h-14` ist genau die Behauptung, die
 * hier geprüft wird, und ein Selektor `.h-14` wäre auch dann grün, wenn das
 * Utility zu nichts kompilierte.
 */
export const bar = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("header") as HTMLElement;

/**
 * **56px, in jeder Kombination** (nur Label / nur Suche / nur Aktionen /
 * alles / nichts). Die Zahl ist kein aus diesem Code abgelesenes Maß, sondern
 * der veröffentlichte Geometrie-Vertrag dieser Zeile: JustRAG positioniert
 * seine Toasts mit `top: 68px` = 56 + 12 darunter und misst dieselbe 56 in
 * einem eigenen Chromium-Test (`AppShellGeometry` in HomeView.stories.tsx).
 */
export async function expectBarHeight(canvasElement: HTMLElement) {
  await expect(getComputedStyle(bar(canvasElement)).height).toBe("56px");
}

/** Sub-pixel slack for "touches but does not overlap". */
export const EDGE_SLACK = 0.5;

/** Portalled layers (menu, dialog) render into `<body>`, outside the canvas. */
export const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/**
 * The chat column of the topic view: `ChatStage` with the args of its own
 * `Conversation` story. Spread rather than `composeStories`, on purpose — that
 * story's meta decorator pins the stage to a 560px box for its own canvas,
 * and in the shell the stage has to fill `<main>` instead.
 */
export function ChatPage() {
  return <ChatStage {...chatStageStories.default.args} {...chatStageStories.Conversation.args} />;
}

/**
 * The native stories set `data-shell` / `data-titlebar` on `<html>` — the
 * document, not the story. On the Docs page every story shares one document,
 * so inline they would turn every other shell on the page native too (the
 * brand of `Overview` slid 100px to the right, behind the window controls).
 * In its own iframe each keeps its attributes to itself.
 */
export const OWN_IFRAME_IN_DOCS = { docs: { story: { inline: false, iframeHeight: 640 } } };

/** Alpha of a computed colour: 1 for `rgb(…)`, the last component otherwise. */
export const alphaOf = (color: string): number => {
  const match = /(?:\/|,)\s*([\d.]+)\)$/.exec(color);
  return color.startsWith("rgb(") || !match ? 1 : Number(match[1]);
};

export const SIDE_TABS = [
  { id: "po", title: "Prüfungsordnung, § 12", closeLabel: "Prüfungsordnung, § 12 schließen" },
  { id: "hb", title: "Modulhandbuch", closeLabel: "Modulhandbuch schließen" },
];

/** What a page declares beside itself: tabs it opened, state it keeps. */
export const SidePanelDemo = ({ initiallyOpen = true }: { initiallyOpen?: boolean }) => {
  const [isOpen, setOpen] = useState(initiallyOpen);
  const [tabs, setTabs] = useState(SIDE_TABS);
  const [activeTabId, setActive] = useState<string | null>("po");
  const [width, setWidth] = useState(400);
  return (
    <AppShellSidePanel
      label="Seitenbereich"
      isOpen={isOpen}
      onOpenChange={setOpen}
      expandLabel="Seitenbereich einblenden"
      collapseLabel="Seitenbereich ausblenden"
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={setActive}
      onTabClose={(id) => {
        const rest = tabs.filter((tab) => tab.id !== id);
        setTabs(rest);
        if (id === activeTabId) setActive(rest[0]?.id ?? null);
        if (rest.length === 0) setOpen(false);
      }}
      tabListLabel="Geöffnete Inhalte"
      width={width}
      resize={{ minWidth: 320, maxWidth: 720, onWidthChange: setWidth, label: "Breite des Seitenbereichs ändern" }}
      launchers={[
        { id: "po", label: "Prüfungsordnung, § 12" },
        { id: "hb", label: "Modulhandbuch" },
        { id: "browser", label: "Browser", disabled: true },
      ]}
      onLaunch={(id) => {
        const tab = SIDE_TABS.find((candidate) => candidate.id === id);
        if (!tab) return;
        if (!tabs.some((open) => open.id === id)) setTabs([...tabs, tab]);
        setActive(id);
      }}
      addLabel="Inhalt öffnen"
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm">
        {activeTabId === "po"
          ? "Die Masterarbeit ist binnen sechs Monaten nach der Ausgabe des Themas abzugeben."
          : "Modul 12: Abschlussmodul, 30 Leistungspunkte."}
      </div>
    </AppShellSidePanel>
  );
};

/** The panel and the floating card side by side: neither covers the other. */
export const expectPanelBesideCard = async (canvas: ReturnType<typeof within>, canvasElement: HTMLElement) => {
  const column = await canvas.findByRole("complementary", { name: "Seitenbereich" });
  const box = column.getBoundingClientRect();
  const content = canvasElement.querySelector("[data-slot='app-shell-content']") as HTMLElement;
  const frame = content.parentElement!.parentElement!.getBoundingClientRect();
  const main = canvas.getByRole("main").getBoundingClientRect();
  // Where the panel leaves the card no room beside the page, the card has
  // closed (rule 4); asked for again, it lies over the page.
  const reopen = within(bar(canvasElement)).queryByRole("button", { name: "Quellen ausklappen" });
  if (reopen) await userEvent.click(reopen);
  const card = (await canvas.findByRole("complementary", { name: "Quellen" })).getBoundingClientRect();
  // A column of the frame: full height, at the end edge, the main area before it.
  await expect(box.width).toBe(400);
  await expect(box.top).toBeCloseTo(frame.top, 0);
  await expect(box.bottom).toBeCloseTo(frame.bottom, 0);
  await expect(box.right).toBeCloseTo(frame.right, 0);
  await expect(main.right).toBeCloseTo(box.left, 0);
  // The card floats over the main area and stops before the panel; so does its toggle.
  await expect(card.width).toBeGreaterThan(0);
  await expect(card.right).toBeLessThan(box.left);
  const cardToggle = within(bar(canvasElement)).getByRole("button", { name: "Quellen einklappen" });
  await expect(cardToggle.getBoundingClientRect().right).toBeLessThan(box.left);
  // The strip is level with the bar; the panel's toggle is its last control,
  // in the frame's top end corner.
  const strip = column.querySelector("[data-slot='app-shell-side-panel-strip']") as HTMLElement;
  await expect(strip.getBoundingClientRect().height).toBe(56);
  await expect(strip.getBoundingClientRect().top).toBeCloseTo(bar(canvasElement).getBoundingClientRect().top, 0);
  const toggle = within(column).getByRole("button", { name: "Seitenbereich ausblenden" });
  await expect(frame.right - toggle.getBoundingClientRect().right).toBeCloseTo(8, 0);
  return { column, strip, frame };
};

/**
 * History buttons as an app would hang them into `titlebarControls`. The
 * native stories also pass the small logo (`nativeLogo`), as the reference
 * consumer does: the header row's minimum width is sized for it.
 */
export const historyControls = (
  <>
    <Button variant="ghost" size="icon" aria-label="Zurück">
      <ChevronLeft size={20} aria-hidden="true" />
    </Button>
    <Button variant="ghost" size="icon" aria-label="Vor">
      <ChevronRight size={20} aria-hidden="true" />
    </Button>
  </>
);

/** The small logo every native story passes, with `historyControls`. */
export const nativeLogo = <Logo product="RAG" size="sm" />;

/**
 * Stands in for the Electron host of „Native shell": sets the two `<html>`
 * attributes the preload would set, paints a backdrop where the OS material
 * would be, and draws three dots where macOS puts the window controls.
 */
export function NativeShellHost({
  children,
  titlebar = "inset",
}: {
  children: ReactNode;
  /** `hidden`: full screen, where the window controls are gone. */
  titlebar?: "inset" | "hidden";
}) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.shell = "native";
    root.dataset.titlebar = titlebar;
    return () => {
      delete root.dataset.shell;
      delete root.dataset.titlebar;
    };
  }, [titlebar]);
  return (
    <div className="relative bg-linear-to-br from-primary-container via-tertiary-container to-secondary-container">
      {titlebar === "inset" && (
        <div
          aria-hidden="true"
          data-slot="window-controls"
          className="pointer-events-none absolute top-5.5 left-4.75 z-30 flex gap-2"
        >
          <span className="size-3 rounded-full bg-on-surface-variant/50" />
          <span className="size-3 rounded-full bg-on-surface-variant/50" />
          <span className="size-3 rounded-full bg-on-surface-variant/50" />
        </div>
      )}
      {children}
    </div>
  );
}
