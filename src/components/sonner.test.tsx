import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Toaster, toast } from "./sonner";

afterEach(() => {
  act(() => {
    toast.dismiss();
  });
  vi.useRealTimers();
  document.documentElement.lang = "";
});

/** The `<time>` in the title row of the toast whose message is `text`. */
const timeOf = (text: string) =>
  screen.getByText(text).closest("[data-slot=toast-title-row]")!.querySelector("time")!;
/** What the time shows (the read-out text is the full date beside it). */
const shown = (time: Element) => time.querySelector("[data-slot=created-time-label]")!.textContent;

/**
 * The DS `toast`: Sonner's, with the creation time in every typed toast's
 * title row. Oracle: the `<time>` element's `dateTime` and its text, formatted
 * for `<html lang>` by `Intl.DateTimeFormat` with the same options.
 */
describe("toast — creation time", () => {
  it("shows the time a toast was raised, as hh:mm today", async () => {
    render(<Toaster />);
    const at = new Date();
    act(() => {
      toast.success("Gespeichert");
    });
    const time = await screen.findByText("Gespeichert").then(() => timeOf("Gespeichert"));
    expect(new Date(time.dateTime).getTime()).toBeGreaterThanOrEqual(at.getTime() - 1000);
    expect(shown(time)).toBe(
      new Intl.DateTimeFormat("de", { hour: "2-digit", minute: "2-digit" }).format(new Date(time.dateTime)),
    );
  });

  it("stamps every typed toast and keeps Sonner's helpers", async () => {
    render(<Toaster />);
    act(() => {
      toast.error("Fehler");
      toast.info("Info");
      toast.warning("Warnung");
      toast("Neutral");
    });
    for (const text of ["Fehler", "Info", "Warnung", "Neutral"]) {
      await screen.findByText(text);
      expect(timeOf(text)).toBeInTheDocument();
    }
    expect(typeof toast.custom).toBe("function");
    expect(typeof toast.dismiss).toBe("function");
  });

  it("adds the date once the toast is from another day", () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date(2026, 10, 25, 23, 59));
    render(<Toaster />);
    act(() => {
      toast("Spät", { duration: Infinity });
      // Sonner hands a new toast to the Toaster in a timeout.
      vi.advanceTimersByTime(1);
    });
    const format = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat("de", { ...options, hour: "2-digit", minute: "2-digit" })
        .format(new Date(2026, 10, 25, 23, 59));
    expect(shown(timeOf("Spät"))).toBe(format({}));
    // Past midnight it is yesterday's toast: the date joins the time.
    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });
    expect(shown(timeOf("Spät"))).toBe(format({ day: "2-digit", month: "2-digit" }));
  });

  it("formats for the page's language", async () => {
    document.documentElement.lang = "en";
    render(<Toaster />);
    act(() => {
      toast("Saved");
    });
    await screen.findByText("Saved");
    const time = timeOf("Saved");
    expect(shown(time)).toBe(
      new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(time.dateTime)),
    );
  });
});
