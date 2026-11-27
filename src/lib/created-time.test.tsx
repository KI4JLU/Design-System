import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { CreatedTime } from "./created-time";

afterEach(() => {
  vi.useRealTimers();
  document.documentElement.lang = "";
});

const shown = (el: Element) => el.querySelector("[data-slot=created-time-label]")?.textContent;
const readOut = (el: Element) => el.querySelector(".sr-only")?.textContent;

describe("CreatedTime", () => {
  it("renders nothing for an invalid date", () => {
    const { container } = render(<CreatedTime at={new Date(Number.NaN)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("formats again when <html lang> changes", async () => {
    const at = new Date();
    at.setHours(14, 32, 0, 0);
    const { container } = render(<CreatedTime at={at} />);
    expect(shown(container)).toBe("14:32");
    await act(async () => {
      document.documentElement.lang = "en";
      // MutationObserver callbacks run as a microtask; let them and the
      // render they schedule finish inside act.
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(shown(container)).toBe(
      new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(at),
    );
  });

  it("keeps the read-out text across midnight while the shown one gains the date", () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date(2026, 10, 25, 23, 59));
    const { container } = render(<CreatedTime at={new Date(2026, 10, 25, 23, 58)} />);
    expect(shown(container)).toBe("23:58");
    const before = readOut(container);
    expect(before).toBe("25.11.2026, 23:58");
    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });
    expect(shown(container)).toBe("25.11., 23:58");
    expect(readOut(container)).toBe(before);
  });

  it("leaves the text out of the server render, so hydration matches", async () => {
    const at = new Date(2026, 10, 25, 14, 32);
    const host = document.createElement("div");
    host.innerHTML = renderToString(<CreatedTime at={at} />);
    // The element and its dateTime, but no text (`dateTime` is UTC and may
    // itself contain the digits, so the text is what is checked).
    expect(host.querySelector("time")).toHaveAttribute("dateTime", at.toISOString());
    expect(host.querySelector("time")).toBeEmptyDOMElement();
    document.body.appendChild(host);
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(host, <CreatedTime at={at} />, { onRecoverableError: (e) => errors.push(e) });
    });
    expect(errors).toEqual([]);
    expect(host.querySelector("time")).toHaveTextContent("14:32");
    host.remove();
  });
});
