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
 * The **counter-check against a consuming app's margin reset**. Not an
 * example to copy but a contract: nothing inside a DS component may shift
 * when an app resets element margins to the user-agent values.
 *
 * Why this story exists: JustRAG keeps a counterweight to Tailwind's
 * Preflight in `index.css` (`@layer base { h1…h6, p { margin: revert } }`),
 * so its own prose keeps its margins. Because `PageHeader`'s `<h1>` carried
 * **no** margin utility, that `revert` won the cascade and the user-agent
 * margin landed in the middle of the DS component — measured at 16.08 px.
 * The app patched it from outside with `[&>header_h1]:m-0`, i.e. with a
 * selector that reaches into the template. This package is meant to make
 * exactly that unnecessary.
 *
 * The reset is set up here **the way an app has it** — in `@layer base`, not
 * as an inline style: only then is it in the same cascade layer, and only
 * then does a green run mean something. A margin utility (`m-0`) lives in
 * Tailwind's `utilities` layer: it changes nothing while Preflight is intact,
 * and it wins against the `revert` **as long as that sits in a layer**. The
 * condition is the layer itself, not the name `base`: a declaration outside
 * any layer overrides every layered one of the same importance, so a reset
 * without `@layer` beats `m-0`. Long form in `docs/COMPONENT_GUIDELINES.md` →
 * "Margins: a DS component never leans on the consumer's reset".
 */
const meta = {
  title: "Foundations/UA-Margin-Reset",
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    // The reset is deliberately ugly for the control elements; this story is
    // a contract, not a template.
    docs: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Literally the shape of the counterweight in JustRAG's `index.css`: the same
 * layer (`base`), the same value (`revert`, i.e. back to the user-agent
 * value), extended by the other elements with a user-agent margin that this
 * package renders (`pre`, `ol`).
 */
const UA_MARGIN_REVERT_CSS = `@layer base {
  h1, h2, h3, h4, h5, h6, p, pre, ol, ul, blockquote, figure, dl, menu, hr {
    margin: revert;
  }
}`;

/**
 * Adds the reset to the document and removes it again on unmount — otherwise
 * it would keep affecting the next stories in the Storybook UI (the preview
 * iframe is reused between stories).
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

/** All four margins of an element as one comparable string. */
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
 * Every component that renders an element with a user-agent margin, under the
 * reset — plus two **control elements without** a margin utility, which
 * *must* shift. Without them the story would be worthless: "nothing moved" is
 * also true when the reset never arrived.
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
    // 1. The reset is really active. Oracle: the user-agent formula of the
    //    HTML rendering standard, `h1 { margin-block: 0.67em }` and
    //    `p { margin-block: 1em }`, against the token font sizes from
    //    tokens.css (`--text-headline-md: 24px`, `--text-body-base: 16px`).
    //    24 × 0.67 = 16.08 px — the same number the consumer measured in
    //    production. None of it comes from the code being checked here.
    // ------------------------------------------------------------------
    const control = query(probe, '[data-testid="control"]');
    await expect(margins(query(control, "h1"))).toBe("16.08px 0px 16.08px 0px");
    await expect(margins(query(control, "p"))).toBe("16px 0px 16px 0px");

    // ------------------------------------------------------------------
    // 2. Nothing inside a DS component moves. A failure here is exactly the
    //    production bug from KI-714.
    // ------------------------------------------------------------------
    const pageHeader = query(probe, '[data-testid="page-header"]');
    await expect(margins(query(pageHeader, "h1"))).toBe("0px 0px 0px 0px");
    await expect(margins(query(pageHeader, "p"))).toBe("0px 0px 0px 0px");

    const form = query(probe, '[data-testid="form"]');
    const formParagraphs = form.querySelectorAll("p");
    // FormDescription + FormMessage — both `<p>`, both under the reset.
    await expect(formParagraphs).toHaveLength(2);
    for (const paragraph of formParagraphs) {
      await expect(margins(paragraph)).toBe("0px 0px 0px 0px");
    }

    await expect(margins(query(probe, '[data-testid="code-block"] pre'))).toBe(
      "0px 0px 0px 0px",
    );

    // The SectionedGridLayout section heading (h2 by default).
    await expect(
      margins(query(probe, '[data-testid="sectioned-grid"] h2')),
    ).toBe("0px 0px 0px 0px");

    // AppShellLayout's `pageLabel` — a <p>, deliberately not a heading.
    await expect(margins(query(probe, '[data-testid="app-shell"] p'))).toBe("0px 0px 0px 0px");

    // Toast viewport: Radix renders an <ol>. It is `fixed bottom-0`; a
    // user-agent margin would lift the bar 16px off the edge.
    await expect(margins(query(document, '[data-testid="toast-viewport"]'))).toBe(
      "0px 0px 0px 0px",
    );

    // Dialog: Radix renders Title as an <h2> and Description as a <p>, and
    // both sit in a portal outside the canvas.
    const dialog = query(document, '[data-testid="dialog"]');
    await expect(margins(query(dialog, "h2"))).toBe("0px 0px 0px 0px");
    await expect(margins(query(dialog, "p"))).toBe("0px 0px 0px 0px");
  },
};

/**
 * The same counter-check for the AI components (KI-916, KI-921): the tooltip
 * of a `MessageAction` (its text is a `<p>`), the caption of
 * `ChainOfThoughtImage` and the default labels of `ReasoningTrigger` (done
 * and while streaming, `Shimmer`).
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
    // The reset is active: the control paragraph gets the user-agent margin.
    await expect(margins(query(probe, '[data-testid="ai-control"]'))).toBe("16px 0px 16px 0px");

    // MessageAction tooltip: its <p> has no margin, and it is as tall as the
    // standard tooltip with the same one-line text.
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

    // ReasoningTrigger: no <p> inside the <button> (content model), so no margin.
    for (const id of ["reasoning-done", "reasoning-streaming"]) {
      const trigger = query(probe, `[data-testid="${id}"] button`);
      await expect(trigger.querySelector("p, h1, h2, h3, h4, h5, h6, div")).toBeNull();
      for (const child of trigger.children) {
        await expect(margins(child)).toBe("0px 0px 0px 0px");
      }
    }
  },
};
