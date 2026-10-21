/*
 * Browser probes for the AI display stories (Reasoning, ChainOfThought,
 * Task). Oracles: the WCAG 2.x relative-luminance contrast formula, and the
 * CSS the browser actually loaded — never the components' class strings.
 */

const parseRgb = (color: string): [number, number, number, number] => {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) throw new Error(`Not an rgb() colour: ${color}`);
  const [r, g, b, a = "1"] = match[1].split(/[\s,/]+/).filter(Boolean);
  return [Number(r), Number(g), Number(b), Number(a)];
};

const luminance = ([r, g, b]: [number, number, number, number]) => {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG contrast ratio of two opaque `rgb()` colours. */
export const contrastRatio = (foreground: string, background: string) => {
  const [a, b] = [luminance(parseRgb(foreground)), luminance(parseRgb(background))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

/** The first non-transparent `background-color` at or above `el`. */
export const effectiveBackground = (el: Element) => {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (parseRgb(bg)[3] > 0) return bg;
  }
  throw new Error("No opaque background found");
};

/**
 * Whether the loaded CSS sets `property: value` for `.className` only under
 * `@media (prefers-reduced-motion: reduce)`. Walks every rule, nested
 * (`.x { @media … { … } }`, Tailwind 4's dev output) or flat
 * (`@media … { .x { … } }`, after minification), so it holds in both
 * `storybook dev` and the built Storybook.
 */
export const reducedMotionSets = (className: string, property: string, value: string) => {
  const escaped = `.${CSS.escape(className)}`;
  const walk = (rules: CSSRuleList, inSelector: boolean, inMedia: boolean): boolean => {
    for (const rule of Array.from(rules)) {
      const selector = inSelector || (rule instanceof CSSStyleRule && rule.selectorText.split(",").some((s) => s.trim() === escaped));
      const media =
        inMedia || (rule instanceof CSSMediaRule && /prefers-reduced-motion:\s*reduce/.test(rule.conditionText));
      const style = (rule as CSSRule & { style?: CSSStyleDeclaration }).style;
      if (selector && media && style?.getPropertyValue(property).trim() === value) return true;
      const children = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules;
      if (children && walk(children, selector, media)) return true;
    }
    return false;
  };
  return Array.from(document.styleSheets).some((sheet) => {
    try {
      return walk(sheet.cssRules, false, false);
    } catch {
      return false; // cross-origin sheet
    }
  });
};
