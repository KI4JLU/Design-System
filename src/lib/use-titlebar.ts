import * as React from "react";

/**
 * Height of the window's title row, in px: the frame's `h-14` chrome row.
 * Floating hints keep out of it (see `TooltipContent`).
 */
export const TITLEBAR_HEIGHT = 56;

/**
 * The host's title-bar mode, read from `<html data-titlebar>` (Storybook
 * „Native shell"): `inset` while the window controls sit in the frame's
 * top-left corner, `hidden` while the title bar is hidden and they are gone
 * (macOS full screen), `null` on the web.
 *
 * Read in JS, not only in CSS, because the mode changes the frame's
 * arrangement — the toggle moves beside the window controls, a notice moves
 * under the top row — and not just a few lengths. The host's preload sets the
 * attribute before the app mounts; later changes (entering full screen) are
 * followed live.
 */
export type TitlebarMode = "inset" | "hidden" | null;

function subscribe(onStoreChange: () => void): () => void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => {};
  }
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-titlebar"],
  });
  return () => observer.disconnect();
}

function read(): TitlebarMode {
  const value = document.documentElement.dataset.titlebar;
  return value === "inset" || value === "hidden" ? value : null;
}

const readOnServer = (): TitlebarMode => null;

export function useTitlebar(): TitlebarMode {
  return React.useSyncExternalStore(subscribe, read, readOnServer);
}
