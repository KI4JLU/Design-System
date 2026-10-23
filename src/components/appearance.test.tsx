import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppearanceProvider } from "./appearance-provider";
import { useAccent, useContrast } from "./appearance-context";

// A controllable matchMedia: `more` decides whether the OS asks for contrast.
let more = false;
const listeners = new Set<() => void>();
beforeEach(() => {
  window.localStorage.clear();
  more = false;
  window.matchMedia = ((query: string) => ({
    get matches() { return query.includes("prefers-contrast") ? more : false; },
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => listeners.clear());

function Probe() {
  const { contrast, resolvedContrast, setContrast } = useContrast();
  const { accent, setAccent } = useAccent();
  return (
    <>
      <p>{`${contrast}/${resolvedContrast}/${accent}`}</p>
      <button type="button" onClick={() => setContrast("more")}>more</button>
      <button type="button" onClick={() => setContrast("medium")}>medium</button>
      <button type="button" onClick={() => setAccent("teal")}>teal</button>
    </>
  );
}

// Oracles: the stubbed OS signal, the clicks, and localStorage — none of it
// computed by the provider.
describe("AppearanceProvider contrast + accent", () => {
  it("follows the OS contrast signal on `system`, live", () => {
    render(<AppearanceProvider><Probe /></AppearanceProvider>);
    expect(screen.getByText("system/normal/standard")).toBeInTheDocument();
    expect(document.documentElement.dataset.contrast).toBe("normal");

    more = true;
    act(() => listeners.forEach((fn) => fn()));
    expect(screen.getByText("system/more/standard")).toBeInTheDocument();
    expect(document.documentElement.dataset.contrast).toBe("more");
  });

  it("applies and remembers a manual contrast and accent", async () => {
    const { unmount } = render(<AppearanceProvider><Probe /></AppearanceProvider>);
    await userEvent.click(screen.getByRole("button", { name: "more" }));
    await userEvent.click(screen.getByRole("button", { name: "teal" }));
    expect(document.documentElement.dataset.contrast).toBe("more");
    expect(document.documentElement.dataset.accent).toBe("teal");
    unmount();

    render(<AppearanceProvider><Probe /></AppearanceProvider>);
    expect(screen.getByText("more/more/teal")).toBeInTheDocument();
  });

  it("applies and remembers `medium`, which the OS signal never overrides", async () => {
    more = true;
    const { unmount } = render(<AppearanceProvider><Probe /></AppearanceProvider>);
    await userEvent.click(screen.getByRole("button", { name: "medium" }));
    expect(document.documentElement.dataset.contrast).toBe("medium");
    expect(window.localStorage.getItem("ui-shape-contrast")).toBe("medium");
    unmount();

    render(<AppearanceProvider><Probe /></AppearanceProvider>);
    expect(screen.getByText("medium/medium/standard")).toBeInTheDocument();
  });
});
