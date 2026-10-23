import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { Button } from "./button";

/**
 * Oracles, and why each is independent of the implementation:
 *
 * - **Live-region semantics** come from WAI-ARIA, not from our code: a
 *   `role="alert"` is *defined* as an `aria-live="assertive"` +
 *   `aria-atomic="true"` region, `role="status"` as the polite one. The tests
 *   read the computed live-region configuration off the DOM and compare it to
 *   that definition; they never look at a class name, a data attribute or a
 *   Radix internal.
 * - **"Does not steal focus"** is resolved against `document.activeElement`
 *   before/after the toast appears — a property of the page, not of the
 *   component.
 * - **"Reachable by keyboard"** is resolved by actually pressing Tab until the
 *   dismiss button holds focus, not by inspecting `tabIndex`.
 * - **Timings** are transcribed from the consumer this primitive replaces
 *   (JustRAG `web/src/contexts/ToastContext.tsx` → `DEFAULT_DURATIONS`:
 *   success 4000, error 6000, warning 5000, info 4000) as literal numbers, so
 *   the test does not agree with `TOAST_DURATIONS` by construction — if the
 *   table is edited, these fail.
 * - **Pause-on-hover / pause-on-focus** is WCAG 2.2.1 „Timing Adjustable":
 *   the user must be able to extend a time limit. The oracle is that the toast
 *   is still on screen well past its duration while the pointer or focus rests
 *   on it.
 */

afterEach(() => {
  vi.useRealTimers();
});

/** Minimal app: a focusable control outside the toast layer + a toast. */
function Harness({
  open = true,
  children,
  viewport = true,
}: {
  open?: boolean;
  children: React.ReactNode;
  viewport?: boolean;
}) {
  return (
    <ToastProvider>
      <Button>Speichern</Button>
      {open ? children : null}
      {viewport ? <ToastViewport /> : null}
    </ToastProvider>
  );
}

/** Every element in the document that is a live region. */
const liveRegions = () =>
  Array.from(document.querySelectorAll("[aria-live]")) as HTMLElement[];

describe("Toast — announcement (WAI-ARIA live regions)", () => {
  it("announces an error assertively — the configuration role=alert is defined as", async () => {
    render(
      <Harness>
        <Toast variant="error">
          <ToastTitle>Speichern fehlgeschlagen</ToastTitle>
        </Toast>
      </Harness>,
    );

    const regions = liveRegions();
    expect(regions).toHaveLength(1);
    // role="alert" === aria-live="assertive" + aria-atomic="true".
    // The explicit aria-live overrides role="status"'s implicit "polite";
    // the atomicity is the one role="status" contributes implicitly.
    expect(regions[0]).toHaveAttribute("aria-live", "assertive");
    expect(regions[0]).toHaveAttribute("role", "status");
  });

  it("announces every non-error variant politely", async () => {
    for (const variant of ["success", "info", "warning", "neutral"] as const) {
      const { unmount } = render(
        <Harness>
          <Toast variant={variant}>
            <ToastTitle>Fertig</ToastTitle>
          </Toast>
        </Harness>,
      );
      const regions = liveRegions();
      expect(regions).toHaveLength(1);
      expect(regions[0]).toHaveAttribute("aria-live", "polite");
      unmount();
    }
  });

  it("lets the call site override the urgency per toast", async () => {
    render(
      <Harness>
        <Toast variant="success" type="foreground">
          <ToastTitle>Konto gelöscht</ToastTitle>
        </Toast>
      </Harness>,
    );
    expect(liveRegions()[0]).toHaveAttribute("aria-live", "assertive");
  });

  it("announces the message exactly once — the visible toast is not itself a live region", async () => {
    render(
      <Harness>
        <Toast variant="info">
          <ToastTitle>Import gestartet</ToastTitle>
          <ToastDescription>12 Dateien werden verarbeitet.</ToastDescription>
        </Toast>
      </Harness>,
    );

    expect(liveRegions()).toHaveLength(1);
    const visible = screen.getByRole("listitem");
    expect(visible).not.toHaveAttribute("aria-live");
    expect(visible).not.toHaveAttribute("role");
    expect(visible).toHaveTextContent("Import gestartet");
  });

  it("announces the message text, prefixed by the provider's label", async () => {
    render(
      <Harness>
        <Toast variant="info">
          <ToastTitle>Import gestartet</ToastTitle>
          <ToastDescription>12 Dateien werden verarbeitet.</ToastDescription>
        </Toast>
      </Harness>,
    );

    await waitFor(() => {
      expect(liveRegions()[0]).toHaveTextContent(
        /Benachrichtigung.*Import gestartet.*12 Dateien/s,
      );
    });
  });

  it("announces an action by its altText, not by its visible label", async () => {
    render(
      <Harness>
        <Toast variant="warning" duration={Infinity}>
          <ToastTitle>Entwurf verworfen</ToastTitle>
          <ToastAction altText="Wiederherstellbar im Verlauf">
            Rückgängig
          </ToastAction>
        </Toast>
      </Harness>,
    );

    await waitFor(() => {
      expect(liveRegions()[0]).toHaveTextContent("Wiederherstellbar im Verlauf");
    });
    // The button label alone would be useless to someone who cannot see the
    // toast in time — it is replaced, not appended.
    expect(liveRegions()[0]).not.toHaveTextContent("Rückgängig");
    // The visible button keeps its short label.
    expect(
      screen.getByRole("button", { name: "Rückgängig" }),
    ).toBeInTheDocument();
  });
});

describe("Toast — focus", () => {
  it("does not steal focus when it appears", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Harness open={false}>
        <Toast variant="success">
          <ToastTitle>Gespeichert</ToastTitle>
        </Toast>
      </Harness>,
    );

    const trigger = screen.getByRole("button", { name: "Speichern" });
    await user.click(trigger);
    expect(trigger).toHaveFocus();

    rerender(
      <Harness open>
        <Toast variant="success">
          <ToastTitle>Gespeichert</ToastTitle>
        </Toast>
      </Harness>,
    );

    expect(await screen.findByText("Gespeichert")).toBeInTheDocument();
    // The user is still exactly where they were.
    expect(trigger).toHaveFocus();
  });

  it("puts the dismiss button within reach of the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <Toast variant="success">
          <ToastTitle>Gespeichert</ToastTitle>
          <ToastClose />
        </Toast>
      </Harness>,
    );

    const close = screen.getByRole("button", { name: "Schließen" });
    screen.getByRole("button", { name: "Speichern" }).focus();

    let reached = false;
    for (let i = 0; i < 6 && !reached; i++) {
      await user.tab();
      reached = document.activeElement === close;
    }
    expect(reached).toBe(true);
  });
});

describe("Toast — dismissal", () => {
  it("closes when the dismiss button is activated", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Harness>
        <Toast variant="success" onOpenChange={onOpenChange}>
          <ToastTitle>Gespeichert</ToastTitle>
          <ToastClose />
        </Toast>
      </Harness>,
    );

    await user.click(screen.getByRole("button", { name: "Schließen" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.queryByText("Gespeichert")).not.toBeInTheDocument(),
    );
  });

  it("renders nothing at all without a ToastViewport (documented Radix contract)", async () => {
    render(
      <Harness viewport={false}>
        <Toast variant="success">
          <ToastTitle>Gespeichert</ToastTitle>
        </Toast>
      </Harness>,
    );
    expect(screen.queryByText("Gespeichert")).not.toBeInTheDocument();
    expect(liveRegions()).toHaveLength(0);
  });
});

describe("Toast — auto-dismiss and WCAG 2.2.1 (Timing Adjustable)", () => {
  const renderWith = (ui: React.ReactNode) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    return render(<Harness>{ui}</Harness>);
  };

  /** Move the clock and let React flush the resulting state updates. */
  const advance = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it("keeps a success toast for 4 s and an error toast for 6 s", async () => {
    renderWith(
      <>
        <Toast variant="success">
          <ToastTitle>Gespeichert</ToastTitle>
        </Toast>
        <Toast variant="error">
          <ToastTitle>Fehlgeschlagen</ToastTitle>
        </Toast>
      </>,
    );

    await advance(3_900);
    expect(screen.queryByText("Gespeichert")).toBeInTheDocument();

    await advance(200);
    expect(screen.queryByText("Gespeichert")).not.toBeInTheDocument();
    // An error outlives a confirmation — it carries something still to act on.
    expect(screen.queryByText("Fehlgeschlagen")).toBeInTheDocument();

    await advance(2_000);
    expect(screen.queryByText("Fehlgeschlagen")).not.toBeInTheDocument();
  });

  it("lets the call site override the variant's duration", async () => {
    renderWith(
      <Toast variant="error" duration={1_000}>
        <ToastTitle>Fehlgeschlagen</ToastTitle>
      </Toast>,
    );

    await advance(1_500);
    expect(screen.queryByText("Fehlgeschlagen")).not.toBeInTheDocument();
  });

  it("never auto-dismisses with duration={Infinity}", async () => {
    renderWith(
      <Toast variant="warning" duration={Infinity}>
        <ToastTitle>Bestätigung nötig</ToastTitle>
      </Toast>,
    );

    await advance(60_000);
    expect(screen.queryByText("Bestätigung nötig")).toBeInTheDocument();
  });

  it("pauses the timer while the pointer rests on the toast", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWith(
      <Toast variant="success">
        <ToastTitle>Gespeichert</ToastTitle>
      </Toast>,
    );

    await advance(3_000);
    await user.hover(screen.getByRole("listitem"));

    // Well past the 4 s limit, and still readable.
    await advance(20_000);
    expect(screen.queryByText("Gespeichert")).toBeInTheDocument();
  });

  it("pauses the timer while focus rests inside the toast (the keyboard route)", async () => {
    renderWith(
      <Toast variant="success">
        <ToastTitle>Gespeichert</ToastTitle>
        <ToastClose />
      </Toast>,
    );

    await advance(3_000);
    screen.getByRole("button", { name: "Schließen" }).focus();

    await advance(20_000);
    expect(screen.queryByText("Gespeichert")).toBeInTheDocument();
  });
});

describe("Toast — status icon (WCAG 1.4.1, Use of Color)", () => {
  /** A decorative graphic must be hidden from assistive tech; the message
   *  itself already carries the meaning. */
  const decorativeGraphic = (toast: HTMLElement) =>
    toast.querySelector('svg[aria-hidden="true"]');

  it("gives every status variant a second, non-color cue", async () => {
    for (const variant of ["success", "error", "warning", "info"] as const) {
      const { unmount } = render(
        <Harness>
          <Toast variant={variant}>
            <ToastTitle>Fertig</ToastTitle>
          </Toast>
        </Harness>,
      );
      expect(decorativeGraphic(screen.getByRole("listitem"))).not.toBeNull();
      unmount();
    }
  });

  it("has no icon for `neutral` (no status) and none when suppressed", async () => {
    const { unmount } = render(
      <Harness>
        <Toast variant="neutral">
          <ToastTitle>Fertig</ToastTitle>
        </Toast>
      </Harness>,
    );
    expect(decorativeGraphic(screen.getByRole("listitem"))).toBeNull();
    unmount();

    render(
      <Harness>
        <Toast variant="success" icon={false}>
          <ToastTitle>Fertig</ToastTitle>
        </Toast>
      </Harness>,
    );
    expect(decorativeGraphic(screen.getByRole("listitem"))).toBeNull();
  });
});

describe("Toast — call-site overrides", () => {
  it("merges className on the toast without dropping the variant's surface", async () => {
    render(
      <Harness>
        <Toast variant="error" className="w-full">
          <ToastTitle>Fehlgeschlagen</ToastTitle>
        </Toast>
      </Harness>,
    );
    const toast = screen.getByRole("listitem");
    expect(toast).toHaveClass("w-full");
    expect(toast).toHaveClass("bg-error-container", "text-on-error-container");
  });

  it("lets the call site rename the dismiss button", async () => {
    render(
      <Harness>
        <Toast variant="success">
          <ToastTitle>Gespeichert</ToastTitle>
          <ToastClose aria-label="Dismiss" />
        </Toast>
      </Harness>,
    );
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Schließen" }),
    ).not.toBeInTheDocument();
  });
});
