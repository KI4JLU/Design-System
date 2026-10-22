import { afterEach, describe, expect, it, vi } from "vitest";
import { realHover, realUnhover, underVitest } from "./real-pointer";

/*
 * The guard of the real-pointer helper: under Vitest a hover that cannot run
 * must fail loudly, never quietly skip the caller's hover checks.
 *
 * ORACLE: this file runs in the jsdom project — under Vitest (`mode` "test"),
 * but outside Browser Mode, where `vitest/browser` is Vitest's own stub that
 * throws on import. That is a real "cannot load", not one the helper sets up.
 * The other cases replace `vitest/browser` with `vi.doMock` or the mode with
 * `vi.stubEnv`, i.e. inputs from outside the helper.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("vitest/browser");
  vi.resetModules();
});

describe("realHover / realUnhover guard", () => {
  it("knows it runs under Vitest", () => {
    expect(underVitest()).toBe(true);
  });

  it("throws under Vitest when vitest/browser cannot be loaded", async () => {
    await expect(realHover(document.body)).rejects.toThrow(/could not be loaded/);
    await expect(realUnhover(document.body)).rejects.toThrow(/could not be loaded/);
  });

  it("throws under Vitest when vitest/browser has no userEvent", async () => {
    vi.doMock("vitest/browser", () => ({ userEvent: null }));
    await expect(realHover(document.body)).rejects.toThrow(/no `userEvent`/);
  });

  it("throws under Vitest when the element does not end up hovered", async () => {
    vi.doMock("vitest/browser", () => ({ userEvent: { hover: async () => {}, unhover: async () => {} } }));
    await expect(realHover(document.body)).rejects.toThrow(/does not match :hover/);
  });

  it("skips (false) outside Vitest, without loading vitest/browser", async () => {
    vi.stubEnv("MODE", "development");
    const hover = vi.fn();
    vi.doMock("vitest/browser", () => ({ userEvent: { hover, unhover: hover } }));
    await expect(realHover(document.body)).resolves.toBe(false);
    await expect(realUnhover(document.body)).resolves.toBe(false);
    expect(hover).not.toHaveBeenCalled();
  });
});
