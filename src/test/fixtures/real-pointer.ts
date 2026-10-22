/*
 * The real pointer, for stories that check a CSS `:hover` state.
 *
 * `userEvent` from `storybook/test` is `@testing-library/user-event`: it
 * dispatches synthetic pointer and mouse events, which run React handlers
 * but never make the browser match `:hover`. Inside the Vitest browser runner
 * (`@storybook/addon-vitest`, Playwright provider), `vitest/browser`'s
 * `userEvent` moves Playwright's real mouse instead, so `:hover` applies and
 * `getComputedStyle` reports the hover colours.
 *
 * Skip or fail:
 * - Outside Vitest (the Storybook UI, `storybook dev` / `storybook build`)
 *   there is no real pointer: `realHover` returns `false` and the caller
 *   skips its hover checks.
 * - Under Vitest the hover MUST happen: when `vitest/browser` cannot be
 *   loaded, or the pointer did not end up over the element, `realHover`
 *   throws, so the story fails instead of passing without its hover checks.
 */

/**
 * Running under Vitest. The signal is Vite's `import.meta.env.MODE`, which
 * Vitest sets to its `mode` — `"test"` by default — while Storybook's dev
 * server and build run `"development"` / `"production"`. It is config, not
 * runtime state of `@vitest/browser`, so it does not depend on anything the
 * hover machinery itself sets up.
 */
export const underVitest = () => import.meta.env.MODE === "test";

async function vitestBrowser() {
  if (!underVitest()) return null;
  // In a Storybook build `MODE` is "production", so `underVitest` compiles to
  // a constant `false` and the import below never runs. The import is not
  // removed, though: Vite still emits `vitest/browser`'s stub as a chunk of
  // its own (`context-*.js` in `storybook-static`, which throws when loaded),
  // and nothing loads it.
  let module: typeof import("vitest/browser");
  try {
    module = await import("vitest/browser");
  } catch (cause) {
    throw new Error(
      "realHover: running under Vitest, but `vitest/browser` could not be loaded — the hover checks cannot run.",
      { cause },
    );
  }
  if (!module.userEvent) {
    throw new Error("realHover: running under Vitest, but `vitest/browser` has no `userEvent`.");
  }
  return module;
}

/**
 * Moves the real pointer onto `el`. `false` outside Vitest (skip the hover
 * checks); under Vitest it throws unless `el` now matches `:hover`.
 */
export async function realHover(el: Element): Promise<boolean> {
  const vitest = await vitestBrowser();
  if (!vitest) return false;
  await vitest.userEvent.hover(el);
  if (!el.matches(":hover")) {
    throw new Error("realHover: the real pointer moved, but the element does not match :hover.");
  }
  return true;
}

/** Moves the real pointer off `el` again. `false` outside Vitest. */
export async function realUnhover(el: Element): Promise<boolean> {
  const vitest = await vitestBrowser();
  if (!vitest) return false;
  await vitest.userEvent.unhover(el);
  return true;
}

/**
 * Presses keys on the real keyboard (Playwright), so the browser's own focus
 * heuristics apply (`:focus-visible`). `false` outside Vitest (skip the checks).
 */
export async function realKeyboard(keys: string): Promise<boolean> {
  const vitest = await vitestBrowser();
  if (!vitest) return false;
  await vitest.userEvent.keyboard(keys);
  return true;
}

/** WCAG 2.x contrast ratio of two computed `rgb(…)` / `rgba(…)` colours (alpha ignored). */
export function contrastRatio(a: string, b: string): number {
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (!channels || channels.length < 3) throw new Error(`not an rgb() colour: ${color}`);
    const [r, g, bl] = channels.map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
