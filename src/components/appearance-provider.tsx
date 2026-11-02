import * as React from "react";
import {
  ACCENT_COLORS,
  AccentContext,
  ColorsContext,
  ContrastContext,
  type AccentColor,
  type ColorsChoice,
  type ContrastChoice,
  type ResolvedContrast,
} from "./appearance-context";

export interface AppearanceProviderProps {
  children: React.ReactNode;
  /** Default `system`. */
  defaultContrast?: ContrastChoice;
  /** Default `standard`. */
  defaultAccent?: AccentColor;
  /** Default `system`. */
  defaultColors?: ColorsChoice;
  /**
   * Prefix of the localStorage keys: `<key>-contrast`, `<key>-accent` and `<key>-colors`.
   * Default `ui-shape` — the name it had while the provider also held the
   * rounded / pill Style, kept so stored contrast and accent survive.
   */
  storageKey?: string;
}

const read = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* per-browser convenience only */
  }
};

const HIGH_CONTRAST_QUERY = "(prefers-contrast: more), (forced-colors: active)";
const systemWantsMore = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(HIGH_CONTRAST_QUERY).matches
    : false;

/**
 * Holds the app-wide appearance preferences — contrast (`useContrast`),
 * accent colour (`useAccent`) and colours (`useColors`) — remembers each per
 * browser and mirrors them to `<html data-contrast data-accent data-colors>`,
 * where the tokens and components pick them up. Mount
 * once near the root, beside ThemeProvider.
 *
 * There is one Style. The rounded / pill switch is gone: every component has
 * exactly one shape, and the `--ui-radius-*` tokens are fixed values.
 */
export function AppearanceProvider({
  children,
  defaultContrast = "system",
  defaultAccent = "standard",
  defaultColors = "system",
  storageKey = "ui-shape",
}: AppearanceProviderProps) {
  const contrastKey = `${storageKey}-contrast`;
  const accentKey = `${storageKey}-accent`;
  const colorsKey = `${storageKey}-colors`;
  const [contrast, setContrastState] = React.useState<ContrastChoice>(() =>
    read(contrastKey, ["system", "normal", "medium", "more"] as const, defaultContrast),
  );
  const [accent, setAccentState] = React.useState<AccentColor>(() => read(accentKey, ACCENT_COLORS, defaultAccent));
  const [colors, setColorsState] = React.useState<ColorsChoice>(() => read(colorsKey, ["system", "reduced"] as const, defaultColors));
  const [systemMore, setSystemMore] = React.useState(systemWantsMore);

  // Follow the OS setting live while the choice is `system`.
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(HIGH_CONTRAST_QUERY);
    const onChange = () => setSystemMore(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const resolvedContrast: ResolvedContrast = contrast === "system" ? (systemMore ? "more" : "normal") : contrast;

  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = resolvedContrast;
    root.dataset.accent = accent;
    root.dataset.colors = colors;
  }, [resolvedContrast, accent, colors]);

  const setContrast = React.useCallback((v: ContrastChoice) => { setContrastState(v); write(contrastKey, v); }, [contrastKey]);
  const setAccent = React.useCallback((v: AccentColor) => { setAccentState(v); write(accentKey, v); }, [accentKey]);
  const setColors = React.useCallback((v: ColorsChoice) => { setColorsState(v); write(colorsKey, v); }, [colorsKey]);

  const contrastValue = React.useMemo(
    () => ({ contrast, resolvedContrast, setContrast }),
    [contrast, resolvedContrast, setContrast],
  );
  const accentValue = React.useMemo(() => ({ accent, setAccent }), [accent, setAccent]);
  const colorsValue = React.useMemo(() => ({ colors, setColors }), [colors, setColors]);

  return (
    <ContrastContext.Provider value={contrastValue}>
      <AccentContext.Provider value={accentValue}>
        <ColorsContext.Provider value={colorsValue}>{children}</ColorsContext.Provider>
      </AccentContext.Provider>
    </ContrastContext.Provider>
  );
}
