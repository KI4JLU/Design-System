import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { CopyIcon } from "lucide-react";
import { ChainOfThoughtImage } from "../components/chain-of-thought";
import { MessageAction } from "../components/message";
import { Reasoning, ReasoningTrigger } from "../components/reasoning";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { CodeBlock } from "../components/code-block";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/dialog";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../components/form";
import { Input } from "../components/input";
import { PageHeader } from "../components/page-header";
import { Toast, ToastProvider, ToastTitle, ToastViewport } from "../components/toast";
import { AppShellLayout } from "../templates/app-shell-layout";
import {
  SectionedGridLayout,
  type SectionedGridSection,
} from "../templates/sectioned-grid-layout";

/**
 * Die **Gegenprobe zum Rand-Reset einer konsumierenden App**. Kein Beispiel
 * zum Nachbauen, sondern ein Vertrag: kein Innenleben einer DS-Komponente
 * darf sich verschieben, wenn eine App die Element-Ränder auf die
 * User-Agent-Werte zurücksetzt.
 *
 * Warum es diese Story gibt: JustRAG hält in `index.css` ein Gegengewicht zu
 * Tailwinds Preflight (`@layer base { h1…h6, p { margin: revert } }`), damit
 * die eigene Prosa ihre Ränder behält. Weil `PageHeader`s `<h1>` **keine**
 * Rand-Utility trug, gewann dieses `revert` die Kaskade und der
 * User-Agent-Rand landete mitten in der DS-Komponente — gemessen 16,08 px.
 * Die App hat das von außen mit `[&>header_h1]:m-0` geflickt, also mit einem
 * Selektor, der ins Template hineingreift. Genau das soll dieses Paket
 * unnötig machen.
 *
 * Der Reset wird hier **so eingerichtet, wie eine App ihn hat** — in
 * `@layer base`, nicht als Inline-Style: nur dann steht er in derselben
 * Kaskadenschicht, und nur dann sagt ein grüner Lauf etwas aus. Eine
 * Rand-Utility (`m-0`) liegt in Tailwinds `utilities`-Schicht: sie ändert
 * nichts, solange Preflight intakt ist, und sie gewinnt gegen das `revert`,
 * **solange dieses in einer Schicht steht**. Bedingung ist die Schicht selbst,
 * nicht der Name `base`: eine Deklaration außerhalb jeder Schicht überstimmt
 * jede geschichtete gleicher Wichtigkeit, ein Reset ohne `@layer` schlägt
 * `m-0` also. Langform in `docs/COMPONENT_GUIDELINES.md` → „Margins: a DS
 * component never leans on the consumer's reset".
 */
const meta = {
  title: "Foundations/UA-Margin-Reset",
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    // Der Reset ist absichtlich hässlich für die Kontrollelemente; diese
    // Story ist ein Vertrag, keine Vorlage.
    docs: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Wörtlich die Form des Gegengewichts aus JustRAGs `index.css`: dieselbe
 * Schicht (`base`), derselbe Wert (`revert`, also zurück auf den
 * User-Agent-Wert), erweitert um die übrigen Elemente mit
 * User-Agent-Rand, die dieses Paket rendert (`pre`, `ol`).
 */
const UA_MARGIN_REVERT_CSS = `@layer base {
  h1, h2, h3, h4, h5, h6, p, pre, ol, ul, blockquote, figure, dl, menu, hr {
    margin: revert;
  }
}`;

/**
 * Hängt den Reset ins Dokument und räumt ihn beim Unmount wieder ab — sonst
 * würde er in der Storybook-UI in den nächsten Stories weiterwirken (das
 * Preview-Iframe wird zwischen Stories wiederverwendet).
 */
function WithUaMarginRevert({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const style = document.createElement("style");
    style.dataset.uaMarginRevert = "true";
    style.textContent = UA_MARGIN_REVERT_CSS;
    document.head.append(style);
    return () => style.remove();
  }, []);
  return <>{children}</>;
}

const SECTIONS: SectionedGridSection[] = [
  {
    id: "own",
    title: "Eigene Sammlungen",
    isOpen: true,
    onOpenChange: () => {},
    items: <div className="rounded-xl border border-outline-variant p-4">Karte</div>,
  },
];

/** Alle vier Ränder eines Elements als ein vergleichbarer String. */
function margins(element: Element): string {
  const style = getComputedStyle(element);
  return [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft].join(" ");
}

function query(root: ParentNode, selector: string): Element {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Element nicht gefunden: ${selector}`);
  return element;
}

/**
 * Jede Komponente, die ein Element mit User-Agent-Rand rendert, unter dem
 * Reset — plus zwei **Kontrollelemente ohne** Rand-Utility, die sich
 * verschieben *müssen*. Ohne die wäre die Story wertlos: „nichts hat sich
 * bewegt" ist auch dann wahr, wenn der Reset nie angekommen ist.
 */
export const NothingMoves: Story = {
  render: () => (
    <WithUaMarginRevert>
      <div className="flex flex-col gap-stack-lg p-8" data-testid="probe">
        {/* KONTROLLE: dieselben Typo-Tokens, aber keine Rand-Utility — hier
            muss der User-Agent-Rand durchschlagen. */}
        <div data-testid="control">
          <h1 className="font-headline-md text-headline-md text-on-surface">
            Kontrollüberschrift ohne Rand-Utility
          </h1>
          <p className="text-body-base text-on-surface-variant">
            Kontrollabsatz ohne Rand-Utility
          </p>
        </div>

        <div data-testid="page-header">
          <PageHeader title="Elemente" description="Alle Elemente dieser Organisation." />
        </div>

        <div data-testid="form">
          <FormItem error="Pflichtfeld">
            <FormLabel>E-Mail</FormLabel>
            <FormControl>
              <Input type="email" />
            </FormControl>
            <FormDescription>Wir teilen sie nicht.</FormDescription>
            <FormMessage />
          </FormItem>
        </div>

        <div data-testid="code-block">
          <CodeBlock code="npm install @ki4jlu/design-system" />
        </div>

        <div data-testid="sectioned-grid">
          <SectionedGridLayout label="Übersicht" sections={SECTIONS} />
        </div>

        <div data-testid="app-shell">
          <AppShellLayout
            logo="Marke"
            nav={<span>Navigation</span>}
            pageLabel="Dashboard"
            leftOpen
            onLeftOpenChange={() => {}}
            mobileTabs={[]}
            activeMobileTab="page"
            onMobileTabChange={() => {}}
            mobileTabBarLabel="Bereichswechsel"
          >
            <span>Inhalt</span>
          </AppShellLayout>
        </div>

        <ToastProvider>
          <Toast open>
            <ToastTitle>Gespeichert</ToastTitle>
          </Toast>
          <ToastViewport data-testid="toast-viewport" />
        </ToastProvider>

        <Dialog defaultOpen>
          <DialogContent data-testid="dialog">
            <DialogHeader>
              <DialogTitle>Widget löschen</DialogTitle>
              <DialogDescription>Das kann nicht rückgängig gemacht werden.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </WithUaMarginRevert>
  ),
  play: async ({ canvasElement }) => {
    const probe = query(canvasElement, '[data-testid="probe"]');

    // ------------------------------------------------------------------
    // 1. Der Reset ist wirklich aktiv. Orakel: die User-Agent-Formel des
    //    HTML-Rendering-Standards, `h1 { margin-block: 0.67em }` und
    //    `p { margin-block: 1em }`, gegen die Token-Schriftgrößen aus
    //    tokens.css (`--text-headline-md: 24px`, `--text-body-base: 16px`).
    //    24 × 0,67 = 16,08 px — dieselbe Zahl, die der Consumer in Produktion
    //    gemessen hat. Nichts davon stammt aus dem Code, der hier geprüft wird.
    // ------------------------------------------------------------------
    const control = query(probe, '[data-testid="control"]');
    await expect(margins(query(control, "h1"))).toBe("16.08px 0px 16.08px 0px");
    await expect(margins(query(control, "p"))).toBe("16px 0px 16px 0px");

    // ------------------------------------------------------------------
    // 2. Kein Innenleben einer DS-Komponente bewegt sich. Ein Fehlschlag hier
    //    ist genau der Produktionsfehler aus KI-714.
    // ------------------------------------------------------------------
    const pageHeader = query(probe, '[data-testid="page-header"]');
    await expect(margins(query(pageHeader, "h1"))).toBe("0px 0px 0px 0px");
    await expect(margins(query(pageHeader, "p"))).toBe("0px 0px 0px 0px");

    const form = query(probe, '[data-testid="form"]');
    const formParagraphs = form.querySelectorAll("p");
    // FormDescription + FormMessage — beide `<p>`, beide unter dem Reset.
    await expect(formParagraphs).toHaveLength(2);
    for (const paragraph of formParagraphs) {
      await expect(margins(paragraph)).toBe("0px 0px 0px 0px");
    }

    await expect(margins(query(probe, '[data-testid="code-block"] pre'))).toBe(
      "0px 0px 0px 0px",
    );

    // Die Abschnittsüberschrift des SectionedGridLayout (per Default h2).
    await expect(
      margins(query(probe, '[data-testid="sectioned-grid"] h2')),
    ).toBe("0px 0px 0px 0px");

    // AppShellLayouts `pageLabel` — ein <p>, absichtlich keine Überschrift.
    await expect(margins(query(probe, '[data-testid="app-shell"] p'))).toBe("0px 0px 0px 0px");

    // Toast-Viewport: Radix rendert ein <ol>. Es ist `fixed bottom-0`, ein
    // User-Agent-Rand würde die Leiste um 16px vom Rand abheben.
    await expect(margins(query(document, '[data-testid="toast-viewport"]'))).toBe(
      "0px 0px 0px 0px",
    );

    // Dialog: Radix rendert Title als <h2> und Description als <p>, und beide
    // liegen in einem Portal außerhalb des Canvas.
    const dialog = query(document, '[data-testid="dialog"]');
    await expect(margins(query(dialog, "h2"))).toBe("0px 0px 0px 0px");
    await expect(margins(query(dialog, "p"))).toBe("0px 0px 0px 0px");
  },
};

/**
 * Dieselbe Gegenprobe für die AI-Komponenten (KI-916, KI-921): der Tooltip
 * einer `MessageAction` (sein Text ist ein `<p>`), die Bildunterschrift von
 * `ChainOfThoughtImage` und die Standard-Beschriftungen von
 * `ReasoningTrigger` (fertig und während des Streams, `Shimmer`).
 */
export const AiComponentsDoNotMove: Story = {
  render: () => (
    <WithUaMarginRevert>
      <div className="flex flex-col items-start gap-stack-lg p-8 pt-16" data-testid="ai-probe">
        <p className="text-body-base text-on-surface-variant" data-testid="ai-control">
          Kontrollabsatz ohne Rand-Utility
        </p>
        <div className="flex gap-16">
          <MessageAction tooltip="Kopieren">
            <CopyIcon className="size-4" />
          </MessageAction>
          <Tooltip open>
            <TooltipTrigger asChild>
              <span data-testid="reference-trigger">Referenz</span>
            </TooltipTrigger>
            <TooltipContent data-testid="reference-tooltip">Kopieren</TooltipContent>
          </Tooltip>
        </div>
        <div data-testid="cot-image">
          <ChainOfThoughtImage caption="Abbildung 1">
            <span>Bild</span>
          </ChainOfThoughtImage>
        </div>
        <div data-testid="reasoning-done">
          <Reasoning duration={3}>
            <ReasoningTrigger />
          </Reasoning>
        </div>
        <div data-testid="reasoning-streaming">
          <Reasoning isStreaming>
            <ReasoningTrigger />
          </Reasoning>
        </div>
      </div>
    </WithUaMarginRevert>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const probe = query(canvasElement, '[data-testid="ai-probe"]');
    // Der Reset ist aktiv: der Kontrollabsatz bekommt den User-Agent-Rand.
    await expect(margins(query(probe, '[data-testid="ai-control"]'))).toBe("16px 0px 16px 0px");

    // MessageAction-Tooltip: sein <p> hat keinen Rand, und er ist so hoch wie
    // der Standard-Tooltip mit demselben einzeiligen Text.
    await userEvent.hover(within(probe as HTMLElement).getByRole("button", { name: "Kopieren" }));
    const actionTooltip = await waitFor(() => {
      const el = [...document.querySelectorAll('[data-slot="tooltip-content"]')].find(
        (c) => !c.matches('[data-testid="reference-tooltip"]'),
      );
      if (!el) throw new Error("MessageAction-Tooltip nicht offen");
      return el;
    });
    await expect(margins(query(actionTooltip, "p"))).toBe("0px 0px 0px 0px");
    const reference = query(document, '[data-testid="reference-tooltip"]');
    await expect(actionTooltip.getBoundingClientRect().height).toBe(
      reference.getBoundingClientRect().height,
    );

    await expect(margins(query(probe, '[data-testid="cot-image"] p'))).toBe("0px 0px 0px 0px");

    // ReasoningTrigger: kein <p> im <button> (Inhaltsmodell), also kein Rand.
    for (const id of ["reasoning-done", "reasoning-streaming"]) {
      const trigger = query(probe, `[data-testid="${id}"] button`);
      await expect(trigger.querySelector("p, h1, h2, h3, h4, h5, h6, div")).toBeNull();
      for (const child of trigger.children) {
        await expect(margins(child)).toBe("0px 0px 0px 0px");
      }
    }
  },
};
