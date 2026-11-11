import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./ThemeContext";

// jsdom has no matchMedia; a controllable stub lets the tests drive the OS
// preference and fire "change" events like a real media query list would.
type ChangeListener = (e: { matches: boolean }) => void;

function mockMatchMedia(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<ChangeListener>();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return dark;
    },
    media: query,
    addEventListener: (_: "change", listener: ChangeListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_: "change", listener: ChangeListener) => {
      listeners.delete(listener);
    },
  })) as unknown as typeof window.matchMedia;
  return {
    setDark(next: boolean) {
      dark = next;
      act(() => listeners.forEach((listener) => listener({ matches: next })));
    },
  };
}

/** Exposes the context values and setTheme triggers for assertions. */
function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("light")}>set-light</button>
      <button onClick={() => setTheme("dark")}>set-dark</button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("ThemeProvider (uncontrolled)", () => {
  it("defaults to 'system' and resolves it against the OS preference", () => {
    mockMatchMedia(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("reads the stored choice from localStorage['theme']", () => {
    mockMatchMedia(false);
    window.localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("setTheme persists to localStorage['theme'] and applies data-theme", async () => {
    mockMatchMedia(false);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "set-dark" }));
    expect(window.localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("storageKey overrides where the choice is read and written", async () => {
    mockMatchMedia(false);
    window.localStorage.setItem("app-theme", "dark");
    render(
      <ThemeProvider storageKey="app-theme">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    await userEvent.click(screen.getByRole("button", { name: "set-light" }));
    expect(window.localStorage.getItem("app-theme")).toBe("light");
    expect(window.localStorage.getItem("theme")).toBeNull();
  });

  it("follows OS changes live while on 'system'", () => {
    const media = mockMatchMedia(false);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    media.setDark(true);
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("notifies onThemeChange in addition to the internal update", async () => {
    mockMatchMedia(false);
    const onThemeChange = vi.fn();
    render(
      <ThemeProvider onThemeChange={onThemeChange}>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "set-dark" }));
    expect(onThemeChange).toHaveBeenCalledExactlyOnceWith("dark");
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });
});

describe("ThemeProvider (controlled)", () => {
  it("renders the given theme and ignores localStorage", () => {
    mockMatchMedia(false);
    window.localStorage.setItem("theme", "light");
    render(
      <ThemeProvider theme="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("setTheme only calls onThemeChange — the theme does not change by itself", async () => {
    mockMatchMedia(false);
    const onThemeChange = vi.fn();
    render(
      <ThemeProvider theme="dark" onThemeChange={onThemeChange}>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "set-light" }));
    expect(onThemeChange).toHaveBeenCalledExactlyOnceWith("light");
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("setTheme writes nothing to localStorage", async () => {
    mockMatchMedia(false);
    render(
      <ThemeProvider theme="dark" onThemeChange={() => {}}>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "set-light" }));
    expect(window.localStorage.getItem("theme")).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });

  it("re-applies data-theme when the controlled prop changes", () => {
    mockMatchMedia(false);
    const { rerender } = render(
      <ThemeProvider theme="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    rerender(
      <ThemeProvider theme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("still resolves a controlled 'system' against the OS preference", () => {
    const media = mockMatchMedia(true);
    render(
      <ThemeProvider theme="system">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    media.setDark(false);
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
  });
});

/**
 * `onThemeApplied` (KI-998): what a native host mirrors to its window. The
 * oracle is that use — the host has to learn the stored choice at start, every
 * later choice, and an OS switch while on "system".
 */
describe("ThemeProvider onThemeApplied", () => {
  it("reports the stored choice on mount", () => {
    mockMatchMedia(false);
    window.localStorage.setItem("theme", "dark");
    const onThemeApplied = vi.fn();
    render(
      <ThemeProvider onThemeApplied={onThemeApplied}>
        <Probe />
      </ThemeProvider>,
    );
    expect(onThemeApplied).toHaveBeenCalledExactlyOnceWith("dark", "dark");
  });

  it("reports a new choice", async () => {
    mockMatchMedia(true);
    const onThemeApplied = vi.fn();
    render(
      <ThemeProvider onThemeApplied={onThemeApplied}>
        <Probe />
      </ThemeProvider>,
    );
    expect(onThemeApplied).toHaveBeenLastCalledWith("system", "dark");
    await userEvent.click(screen.getByRole("button", { name: "set-light" }));
    expect(onThemeApplied).toHaveBeenLastCalledWith("light", "light");
    expect(onThemeApplied).toHaveBeenCalledTimes(2);
  });

  it("reports an OS switch while on system", () => {
    const os = mockMatchMedia(false);
    const onThemeApplied = vi.fn();
    render(
      <ThemeProvider onThemeApplied={onThemeApplied}>
        <Probe />
      </ThemeProvider>,
    );
    os.setDark(true);
    expect(onThemeApplied).toHaveBeenLastCalledWith("system", "dark");
  });

  it("does not report again when only the callback changes", () => {
    mockMatchMedia(false);
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <ThemeProvider theme="dark" onThemeApplied={first}>
        <Probe />
      </ThemeProvider>,
    );
    rerender(
      <ThemeProvider theme="dark" onThemeApplied={second}>
        <Probe />
      </ThemeProvider>,
    );
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });
});
