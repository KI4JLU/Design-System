import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";
import { TooltipContent } from "./tooltip";

/**
 * Catch-all for native `title` tooltips: mount once near the app root and
 * every element carrying a `title` attribute shows the design system's
 * tooltip instead of the browser's — including titles added later, in
 * third-party markup or inside portals.
 *
 * How: one capture-phase listener on `document` finds the nearest `[title]`
 * under the pointer (or a keyboard-focused element with a title). While that
 * element is active its `title` is emptied (the text parked in `data-title`),
 * which suppresses the native tooltip, and written back when the pointer or
 * focus leaves. Emptying rather than removing keeps React's updates visible:
 * a new value is picked up, a removed title stays removed. One shared
 * `TooltipContent` is anchored to an invisible fixed-position proxy laid over
 * the element, portalled into the fullscreen element while one is active.
 * The content is hoverable: the pointer may move onto it (WCAG 1.4.13).
 *
 * Accessibility: while parked, the title keeps its role in the accessible
 * name computation — it becomes a temporary `aria-label` when it was the
 * element's name, else a description (`aria-describedby` to a hidden copy)
 * unless it only repeats the name. The catch-all cannot make an element
 * focusable: a title on a `span` stays unreachable by keyboard and touch —
 * give such hints a focusable trigger and an explicit `Tooltip`.
 *
 * Tone: primary like `Tooltip`; inverse inside `[data-tooltip-tone="inverse"]`
 * (set by `Message`, matching `MessageAction`).
 *
 * Scope: plain text only (`white-space: pre-line` keeps line breaks). Touch
 * is ignored, as the native tooltip is. Opt out per subtree with
 * `data-native-title`. Elements inside an explicit `TooltipTrigger` are
 * skipped, so they never show two tooltips.
 */
export interface TitleTooltipsProps {
  /** Hover delay before the tooltip opens, in ms. Default 0, like `Tooltip`. */
  delayDuration?: number;
}

type Active = {
  el: HTMLElement;
  text: string;
  /** Shown while either holds: the pointer is on it, or it has keyboard focus. */
  hovered: boolean;
  focused: boolean;
  describedBy: boolean;
  /** The title is the element's name: mirrored into a temporary aria-label. */
  labelled: boolean;
  /** The aria-label we wrote, so one the app writes later is never touched. */
  ownLabel: string | null;
  /** An empty aria-label that was there before ours, put back on release. */
  priorLabel: string | null;
  /** False once the app cleared or removed the title itself. */
  restore: boolean;
  /** Our own pending writes of the empty placeholder, for the observer. */
  ownWrites: number;
};

type Tone = "primary" | "inverse";
type Tip = { text: string; rect: DOMRect; tone: Tone; container: HTMLElement | null };

/** Grace period for the pointer to cross from the element onto the tooltip. */
const LEAVE_GRACE_MS = 150;

/** `data-tooltip-tone="inverse"` on an ancestor (e.g. `Message`) switches to
 * the inverse surface, for places where a primary tooltip would sit on a
 * primary surface and disappear. */
function toneOf(el: HTMLElement): Tone {
  return el.closest("[data-tooltip-tone]")?.getAttribute("data-tooltip-tone") === "inverse"
    ? "inverse"
    : "primary";
}

const SKIP_SELECTOR =
  '[data-native-title], [data-slot="tooltip-trigger"], [data-slot="tooltip-content"]';

/** Keyboard focus only, like `Tooltip`; engines without `:focus-visible`
 * (older jsdom) count every focus. */
function focusVisible(el: HTMLElement): boolean {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}

const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** WAI-ARIA roles that take their name from content. */
const NAME_FROM_CONTENT_ROLES = new Set([
  "button", "cell", "checkbox", "columnheader", "gridcell", "heading", "link",
  "menuitem", "menuitemcheckbox", "menuitemradio", "option", "radio", "row",
  "rowheader", "switch", "tab", "tooltip", "treeitem",
]);

/** Native elements with an implicit role that is not named from content. */
const NAMED_NOT_BY_CONTENT_TAGS = new Set([
  "ARTICLE", "ASIDE", "DIALOG", "FIGURE", "FOOTER", "FORM", "HEADER", "MAIN",
  "MENU", "NAV", "OL", "SECTION", "UL",
]);

/** True when the title is where the element's accessible name comes from:
 * nothing earlier in the name computation (aria-labelledby, aria-label, a
 * `<label>`, alt text, content) names it. */
function namedByTitle(el: HTMLElement): boolean {
  if (labelledByText(el) || norm(el.getAttribute("aria-label"))) return false;
  const labels = (el as Partial<HTMLInputElement>).labels;
  if (labels && labels.length > 0) return false;
  if (el instanceof HTMLInputElement) {
    if (el.type === "submit" || el.type === "reset") return false; // value or the default ("Submit")
    if (el.type === "button") return !norm(el.value);
    if (el.type === "image") return !norm(el.alt);
  }
  // Form fields never take their name from content (options, default text,
  // fallback text of progress / meter / output).
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLProgressElement ||
    el instanceof HTMLMeterElement ||
    el instanceof HTMLOutputElement
  ) {
    return true;
  }
  // An explicit role that does not take its name from content (img, region,
  // textbox, …) is named by the title whatever it contains.
  const role = el.getAttribute("role");
  if (role && !NAME_FROM_CONTENT_ROLES.has(role)) return true;
  // Same for native elements whose implicit role is not named by content
  // (landmarks, lists, figures, dialogs).
  if (!role && NAMED_NOT_BY_CONTENT_TAGS.has(el.tagName)) return true;
  if (el instanceof HTMLImageElement && norm(el.alt)) return false;
  // Native elements named by a child element, not by their content.
  if (el instanceof HTMLTableElement) return !norm(el.caption?.textContent);
  if (el instanceof HTMLFieldSetElement) return !norm(el.querySelector(":scope > legend")?.textContent);
  // A descendant named another way (an svg with aria-label, an img with alt)
  // names the element through its content.
  const isHidden = hiddenWithin(el);
  const named = el.querySelectorAll('img[alt]:not([alt=""]), [aria-label], [aria-labelledby]');
  if ([...named].some((d) => !isHidden(d))) return false;
  return contentName(el) === "";
}

/** The text an element's content contributes to its name: text nodes
 * outside `aria-hidden`, `hidden` or CSS-hidden subtrees (a decorative "×"
 * names nothing). Only runs on hover/focus, so the style lookups are cheap. */
function contentName(el: HTMLElement): string {
  const isHidden = hiddenWithin(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let text = "";
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.parentElement && n.parentElement !== el && isHidden(n.parentElement)) continue;
    text += ` ${n.nodeValue ?? ""}`;
  }
  return norm(text);
}

/** A memoised "is this descendant of `root` hidden from the accessibility
 * tree?" — `aria-hidden`, `hidden` or CSS-hidden on it or on an ancestor
 * below `root`. */
function hiddenWithin(root: Element): (node: Element) => boolean {
  const cache = new Map<Element, boolean>();
  const isHidden = (node: Element): boolean => {
    if (node === root) return false;
    const cached = cache.get(node);
    if (cached !== undefined) return cached;
    const style = getComputedStyle(node);
    const hidden =
      node.getAttribute("aria-hidden") === "true" ||
      node.hasAttribute("hidden") ||
      style.display === "none" ||
      style.visibility === "hidden" ||
      (node.parentElement !== null && isHidden(node.parentElement));
    cache.set(node, hidden);
    return hidden;
  };
  return isHidden;
}

/** The element's accessible name from the sources that beat `title`:
 * aria-labelledby, then aria-label, then content. */
function currentName(el: HTMLElement): string {
  return labelledByText(el) || norm(el.getAttribute("aria-label")) || contentName(el);
}

/** The text aria-labelledby resolves to; empty when it references nothing. */
function labelledByText(el: HTMLElement): string {
  const ids = el.getAttribute("aria-labelledby");
  if (!ids) return "";
  return norm(
    ids
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" "),
  );
}

/** True when the title only repeats what the element is already named. */
function repeatsName(el: HTMLElement, text: string): boolean {
  return norm(text) === currentName(el);
}

export function TitleTooltips({ delayDuration = 0 }: TitleTooltipsProps) {
  const descId = React.useId();
  const descRef = React.useRef<HTMLSpanElement>(null);
  const [tip, setTip] = React.useState<Tip | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let active: Active | null = null;
    let showTimer: number | undefined;
    let leaveTimer: number | undefined;
    let observer: MutationObserver | null = null;
    // Focus that follows a click or tap is not keyboard focus, although text
    // inputs match :focus-visible either way.
    let pointerFocusUntil = 0;

    const hide = () => {
      window.clearTimeout(showTimer);
      setOpen(false);
    };

    const cancelLeave = () => window.clearTimeout(leaveTimer);

    const removeDescribedBy = (el: HTMLElement) => {
      const ids = (el.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter((id) => id && id !== descId);
      if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
      else el.removeAttribute("aria-describedby");
    };

    /** Count the app's title writes among `records` (ours are skipped by
     * `ownWrites`); true when the app wrote. */
    const appWroteTitle = (a: Active, records: MutationRecord[]): boolean => {
      let appWrote = false;
      for (const r of records) {
        if (r.type !== "attributes") continue;
        if (a.ownWrites > 0) a.ownWrites -= 1;
        else appWrote = true;
      }
      return appWrote;
    };

    const release = () => {
      cancelLeave();
      hide();
      const a = active;
      // A title change and a blur in the same task: the observer has not run
      // yet, so read its pending records before restoring anything.
      if (a && observer && appWroteTitle(a, observer.takeRecords()) && !a.el.getAttribute("title")) {
        a.restore = false;
      }
      observer?.disconnect();
      observer = null;
      active = null;
      if (!a) return;
      // Still our empty placeholder: put the text back. A new value the app
      // wrote stays; a title it cleared or removed stays that way.
      if (a.restore && a.el.getAttribute("title") === "") a.el.setAttribute("title", a.text);
      a.el.removeAttribute("data-title");
      // Only while it is still ours: an aria-label the app set meanwhile stays.
      if (a.ownLabel !== null && a.el.getAttribute("aria-label") === a.ownLabel) {
        if (a.priorLabel !== null) a.el.setAttribute("aria-label", a.priorLabel);
        else a.el.removeAttribute("aria-label");
      }
      if (a.describedBy) removeDescribedBy(a.el);
    };

    const scheduleLeave = () => {
      cancelLeave();
      leaveTimer = window.setTimeout(() => {
        if (!active) return;
        active.hovered = false;
        if (!active.focused) release(); // keyboard focus still holds it open
      }, LEAVE_GRACE_MS);
    };

    /** Empty the element's title (suppressing the native tooltip), park the
     * text in data-title and keep it in the accessible name computation. */
    const park = (a: Active) => {
      const text = a.el.getAttribute("title") || a.text;
      a.text = text;
      a.ownWrites += 1;
      a.el.setAttribute("title", "");
      a.el.setAttribute("data-title", text);
      if (descRef.current) descRef.current.textContent = text;
      if (a.labelled) {
        const current = a.el.getAttribute("aria-label");
        if (current !== null && current !== a.ownLabel && norm(current)) {
          a.labelled = false; // the app named it meanwhile: hands off
        } else {
          // An empty aria-label names nothing (namedByTitle agrees); keep it
          // to put back.
          if (current !== null && current !== a.ownLabel) a.priorLabel = current;
          a.el.setAttribute("aria-label", text);
          a.ownLabel = text;
        }
      }
      const wantDesc = !a.labelled && !repeatsName(a.el, text);
      if (wantDesc && !a.describedBy) {
        const ids = a.el.getAttribute("aria-describedby");
        a.el.setAttribute("aria-describedby", ids ? `${ids} ${descId}` : descId);
      } else if (!wantDesc && a.describedBy) {
        removeDescribedBy(a.el);
      }
      a.describedBy = wantDesc;
    };

    const show = (delay: number) => {
      window.clearTimeout(showTimer);
      const run = () => {
        if (!active || !active.el.isConnected) return;
        setTip({
          text: active.text,
          rect: active.el.getBoundingClientRect(),
          tone: toneOf(active.el),
          container: document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : null,
        });
        setOpen(true);
      };
      if (delay > 0) showTimer = window.setTimeout(run, delay);
      else run();
    };

    const claim = (el: HTMLElement, via: "pointer" | "focus") => {
      cancelLeave();
      if (active?.el === el) {
        if (via === "pointer") active.hovered = true;
        else if (!active.focused) {
          active.focused = true;
          show(0); // keyboard focus opens at once, even during a hover delay
        }
        return;
      }
      release();
      const a: Active = {
        el,
        text: el.getAttribute("title") ?? "",
        hovered: via === "pointer",
        focused: via === "focus",
        describedBy: false,
        labelled: namedByTitle(el),
        ownLabel: null,
        priorLabel: null,
        restore: true,
        ownWrites: 0,
      };
      active = a;
      observer = new MutationObserver((records) => {
        if (active !== a) return;
        if (!a.el.isConnected) {
          release();
          return;
        }
        // Records arrive in order; skip the ones our own placeholder writes
        // caused, so every remaining one is the app's.
        if (!appWroteTitle(a, records)) return;
        const value = a.el.getAttribute("title");
        if (!value) {
          // The app cleared or removed the title: nothing to show or restore.
          a.restore = false;
          release();
        } else {
          park(a); // The app wrote a new title.
          setTip((t) => (t ? { ...t, text: a.text } : t));
        }
      });
      observer.observe(el, { attributes: true, attributeFilter: ["title"] });
      observer.observe(document.body, { childList: true, subtree: true });
      park(a); // after observe(), so ownWrites matches the records it causes
      show(via === "pointer" ? delayDuration : 0);
    };

    /** The element whose title the browser would show for `node`: the
     * nearest ancestor carrying a `title` attribute (an empty one shows
     * nothing and hides the ancestors' titles). The active element's own
     * title is emptied while parked, so it is matched by identity. */
    const titledAncestor = (node: EventTarget | null): HTMLElement | null => {
      for (let n = node instanceof Element ? node : null; n; n = n.parentElement) {
        if (active && n === active.el) return active.el;
        // An opt-out or explicit tooltip between the target and a titled
        // ancestor is a boundary too, not only one around the ancestor.
        if (n.matches(SKIP_SELECTOR)) return null;
        const title = n.getAttribute("title");
        if (title === null) continue;
        if (!title.trim() || !(n instanceof HTMLElement) || n instanceof HTMLIFrameElement) return null;
        return n.closest(SKIP_SELECTOR) ? null : n;
      }
      return null;
    };

    const onPointerOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (e.target instanceof Element && e.target.closest('[data-title-tooltip=""]')) {
        cancelLeave(); // on the tooltip itself: keep it (hoverable content)
        return;
      }
      const el = titledAncestor(e.target);
      if (el) claim(el, "pointer");
      else if (active?.hovered) scheduleLeave();
    };

    const onPointerOut = (e: PointerEvent) => {
      // Leaving the window: no pointerover follows. (Through the grace
      // period, so an engine that omits relatedTarget still lets the pointer
      // reach the tooltip.)
      if (!e.relatedTarget && active?.hovered) scheduleLeave();
    };

    const onPointerDown = () => {
      pointerFocusUntil = Date.now() + 1000;
      hide();
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (Date.now() < pointerFocusUntil) return;
      if (titledAncestor(target) !== target) return;
      if (!focusVisible(target)) return;
      claim(target, "focus");
    };

    const onFocusOut = (e: FocusEvent) => {
      if (!active || e.target !== active.el) return;
      active.focused = false;
      if (!active.hovered) release(); // the pointer still holds it open
    };

    const onKeyDown = (e: KeyboardEvent) => {
      pointerFocusUntil = 0; // keyboard navigation resumed
      if (e.key === "Escape") hide();
    };

    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("pointerout", onPointerOut, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("fullscreenchange", hide);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      release();
      document.removeEventListener("pointerover", onPointerOver, true);
      document.removeEventListener("pointerout", onPointerOut, true);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("fullscreenchange", hide);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [delayDuration, descId]);

  const rect = tip?.rect;
  const container = tip?.container ?? null;
  const root = (
    // Hover and focus lifetimes are tracked by the document listeners above;
    // Radix's own hoverable-content tracking would close a focused tooltip.
    <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent>
      <TooltipPrimitive.Root open={open && !!tip} onOpenChange={(o) => !o && setOpen(false)}>
        <TooltipPrimitive.Trigger asChild>
          <span
            aria-hidden="true"
            data-slot="title-tooltip-anchor"
            style={{
              position: "fixed",
              top: rect?.top ?? 0,
              left: rect?.left ?? 0,
              width: rect?.width ?? 0,
              height: rect?.height ?? 0,
              pointerEvents: "none",
            }}
          />
        </TooltipPrimitive.Trigger>
        <TooltipContent
          container={container}
          data-title-tooltip=""
          className={cn(
            "whitespace-pre-line",
            tip?.tone === "inverse" && "bg-inverse-surface text-inverse-on-surface",
          )}
        >
          {tip?.text}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
  return (
    <>
      <span id={descId} ref={descRef} hidden />
      {/* While fullscreen, only the fullscreen subtree is painted: the anchor
          (and the content, via `container`) must live inside it. */}
      {container ? createPortal(root, container) : root}
    </>
  );
}
