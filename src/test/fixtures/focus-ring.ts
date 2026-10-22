import { realKeyboard } from "./real-pointer";

/**
 * The computed focus-ring style (what the DS Button focus recipe sets), read
 * after any running transition ends — Button's `transition-all` animates the
 * ring in.
 */
export async function focusRingStyle(el: Element) {
  await Promise.all(el.getAnimations().map((a) => a.finished));
  const s = getComputedStyle(el);
  return { boxShadow: s.boxShadow, outlineStyle: s.outlineStyle };
}

/**
 * Keyboard-focuses `target` (real Tab from `reference`) and then `reference`
 * (real Shift+Tab back), returning both computed focus-ring styles. `reference`
 * must directly precede `target` in tab order. `null` outside Vitest, where
 * there is no real keyboard.
 */
export async function keyboardFocusRings(reference: HTMLElement, target: HTMLElement) {
  reference.focus();
  if (!(await realKeyboard("{Tab}"))) return null;
  if (document.activeElement !== target) throw new Error("Tab did not reach the target");
  const targetRing = await focusRingStyle(target);
  await realKeyboard("{Shift>}{Tab}{/Shift}");
  if (document.activeElement !== reference) throw new Error("Shift+Tab did not reach the reference");
  return { reference: await focusRingStyle(reference), target: targetRing };
}
