import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResizeHandle } from "./resize-handle";

/**
 * Oracles used here are external to the component:
 *
 * 1. **The WAI-ARIA APG „Window Splitter" pattern and the `separator` role it
 *    uses** — a *focusable* separator carries `aria-valuenow` plus
 *    `aria-valuemin`/`aria-valuemax` (which default to 0/100 and so must be
 *    stated), is in the tab order, and „the value of aria-valuenow must be
 *    between aria-valuemin and aria-valuemax". `aria-orientation` on a
 *    `separator` describes the orientation of the separator itself and defaults
 *    to `horizontal`, so a bar standing between two side-by-side panes must
 *    state `vertical` — that expected value comes from the widget's geometry
 *    (oracle 2) and the role's default, not from reading the component.
 *    The splitter's arrow keys are **directional** (they move the separator),
 *    which is why the same key raises the reported width of a left pane and
 *    lowers that of a right one; Home/End are the advertised minimum resp.
 *    maximum *value*, not a direction, so they cannot depend on `side`.
 * 2. **Hand-computed geometry** — a pane whose resizable edge faces right gets
 *    wider by exactly the distance the pointer travelled right; a pane whose
 *    edge faces left gets narrower by that same distance. Every expected number
 *    below is arithmetic on the props the test passes in (300 + 10, 300 + 40,
 *    …), never a value read back out of the component.
 */

const MIN = 150;
const MAX = 600;

/** Controlled wrapper — the component is value-controlled, so multi-step
 *  keyboard sequences need the consumer half of the contract. */
function ControlledHandle({
  side,
  initial,
  onValueChange,
}: {
  side: "left" | "right";
  initial: number;
  onValueChange?: (value: number) => void;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <ResizeHandle
      side={side}
      value={value}
      min={MIN}
      max={MAX}
      label="Breite ändern"
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

function press(key: string) {
  return userEvent.keyboard(`{${key}}`);
}

describe("ResizeHandle", () => {
  it("exposes the focusable-separator contract of the splitter pattern", () => {
    render(
      <ResizeHandle
        side="left"
        value={320}
        min={MIN}
        max={MAX}
        step={10}
        label="Breite ändern"
        onValueChange={() => {}}
      />,
    );
    // Oracle 1: the attributes a focusable separator (window splitter) carries,
    // by name and value. The query itself is the role assertion — `getByRole`
    // resolves the role through aria-query, so a wrong `role` attribute makes
    // this line throw rather than pass.
    const handle = screen.getByRole("separator", { name: "Breite ändern" });
    expect(handle).toHaveAttribute("aria-valuemin", String(MIN));
    expect(handle).toHaveAttribute("aria-valuemax", String(MAX));
    expect(handle).toHaveAttribute("aria-valuenow", "320");
    expect(handle).toHaveAttribute("tabindex", "0");
    // Oracle 1 + 2, and deliberately *not* a read-back of the implementation:
    // `aria-orientation` on a `separator` describes the orientation of the
    // separator itself and defaults to `horizontal` — checkable in-repo, and by the
    // same transcription `getByRole` resolves through:
    // node_modules/aria-query/lib/etc/roles/literal/separatorRole.js:16.
    // (`sliderRole` defaults to `horizontal` too, so the old `vertical` was an
    // active false claim of a vertical value axis, not inherited redundancy.)
    // This bar stands between two
    // side-by-side panes, so the geometry says vertical and the default says it
    // must be stated. (Under the former `slider` role the attribute meant the
    // axis the *value* moves along — horizontal — which is why asserting
    // „vertical" there could only have restated the code.)
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
  });

  it("references the pane it resizes via aria-controls, and the reference resolves", () => {
    // Oracle 1: the APG splitter sets `aria-controls` to the id of its primary
    // pane — the pane whose size `aria-valuenow` reports. And per WAI-ARIA,
    // an id reference must name an element that exists in the document: a
    // dangling `aria-controls` is worse than none. So this test does NOT
    // check attribute presence — it resolves the reference through the
    // document and asserts the resolved element holds the pane's content.
    render(
      <>
        <div id="verlauf-pane">
          <p>Verlaufs-Inhalt</p>
        </div>
        <ResizeHandle
          side="left"
          value={320}
          min={MIN}
          max={MAX}
          label="Breite ändern"
          controls="verlauf-pane"
          onValueChange={() => {}}
        />
      </>,
    );
    const handle = screen.getByRole("separator", { name: "Breite ändern" });
    const controls = handle.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    const pane = document.getElementById(controls as string);
    expect(pane).not.toBeNull();
    expect(pane).toContainElement(screen.getByText("Verlaufs-Inhalt"));
  });

  it("renders no aria-controls at all when `controls` is not given", () => {
    // The standalone case: without an id the attribute must be ABSENT, never
    // present-but-dangling — WAI-ARIA id references must resolve (see above),
    // and an empty/broken reference would be an active false claim.
    render(
      <ResizeHandle
        side="left"
        value={320}
        min={MIN}
        max={MAX}
        label="Breite ändern"
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByRole("separator")).not.toHaveAttribute("aria-controls");
  });

  it("answers to both key axes: ↑/↓ are aliases of →/←", async () => {
    // Oracle: the documented alias contract (resize-handle.tsx +
    // resize-handle.mdx). The splitter pattern assigns ←/→ to a vertical
    // separator; ↑/↓ carry no other meaning on it, so this handle also accepts
    // them and both axes must move the value by one `step`. Numbers are
    // arithmetic on the props (300 + 10), never read back out of the component.
    const onValueChange = vi.fn();
    render(
      <ResizeHandle
        side="left"
        value={300}
        min={MIN}
        max={MAX}
        step={10}
        label="Breite ändern"
        onValueChange={onValueChange}
      />,
    );
    const handle = screen.getByRole("separator");
    handle.focus();

    await press("ArrowUp");
    expect(onValueChange).toHaveBeenLastCalledWith(310);
    await press("ArrowRight");
    expect(onValueChange).toHaveBeenLastCalledWith(310);
  });

  it("keeps its ARIA guarantees when a consumer tries to override them", () => {
    // Oracle 1 (aria-valuenow must lie within [min, max]) + the component's own
    // documented guarantee. The cast is deliberate: the props type already
    // forbids this, and this pins that the runtime does too — the guaranteed
    // attributes are applied AFTER the spread, so a JS consumer cannot smuggle
    // an out-of-range value past the clamp or drop the tab stop.
    const smuggled = {
      "aria-valuenow": 9999,
      "aria-valuemax": 9999,
      "aria-controls": "does-not-exist",
      tabIndex: -1,
      role: "presentation",
    } as unknown as Record<string, unknown>;
    render(
      <ResizeHandle
        side="left"
        value={320}
        min={MIN}
        max={MAX}
        label="Breite ändern"
        onValueChange={() => {}}
        {...smuggled}
      />,
    );
    const handle = screen.getByRole("separator", { name: "Breite ändern" });
    expect(handle).toHaveAttribute("aria-valuenow", "320");
    expect(handle).toHaveAttribute("aria-valuemax", String(MAX));
    expect(handle).toHaveAttribute("tabindex", "0");
    // A spread `aria-controls` would point at whatever the consumer typed —
    // here a nonexistent id, i.e. a dangling reference. `controls` is the one
    // way in, so the smuggled attribute must not survive either.
    expect(handle).not.toHaveAttribute("aria-controls");
  });

  it("never reports aria-valuenow outside [min, max]", () => {
    // Oracle 1: even if the consumer's stored width is stale/out of range, the
    // announced value must stay inside the advertised range.
    render(
      <ResizeHandle
        side="left"
        value={9000}
        min={MIN}
        max={MAX}
        label="Breite ändern"
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-valuenow",
      String(MAX),
    );
  });

  describe("arrow keys follow the pane's side", () => {
    it("grows a LEFT pane on ArrowRight and shrinks it on ArrowLeft", async () => {
      const onValueChange = vi.fn();
      render(
        <ResizeHandle
          side="left"
          value={300}
          min={MIN}
          max={MAX}
          step={10}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      screen.getByRole("separator").focus();

      await press("ArrowRight");
      expect(onValueChange).toHaveBeenLastCalledWith(310); // 300 + 10
      await press("ArrowLeft");
      expect(onValueChange).toHaveBeenLastCalledWith(290); // 300 - 10
    });

    it("grows a RIGHT pane on ArrowLeft and shrinks it on ArrowRight", async () => {
      // The mirrored case — inverting this pair is the obvious bug, so it is
      // pinned per side. Oracle 2: the right pane's edge faces left, so the
      // pointer/key direction that widens it is the opposite one.
      const onValueChange = vi.fn();
      render(
        <ResizeHandle
          side="right"
          value={300}
          min={MIN}
          max={MAX}
          step={10}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      screen.getByRole("separator").focus();

      await press("ArrowLeft");
      expect(onValueChange).toHaveBeenLastCalledWith(310); // 300 + 10
      await press("ArrowRight");
      expect(onValueChange).toHaveBeenLastCalledWith(290); // 300 - 10
    });

    it("treats ArrowUp/ArrowDown as aliases of ArrowRight/ArrowLeft on a LEFT pane", async () => {
      // Oracle: the documented alias contract — Up behaves exactly as Right and
      // Down exactly as Left, so one widget has one behaviour whichever axis the
      // user reaches for. Numbers are arithmetic on the props (300 ± 10).
      const onValueChange = vi.fn();
      render(
        <ResizeHandle
          side="left"
          value={300}
          min={MIN}
          max={MAX}
          step={10}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      screen.getByRole("separator").focus();

      await press("ArrowUp");
      expect(onValueChange).toHaveBeenLastCalledWith(310);
      await press("ArrowDown");
      expect(onValueChange).toHaveBeenLastCalledWith(290);
    });

    it("mirrors ArrowUp/ArrowDown per side on a RIGHT pane", async () => {
      // The alias holds on both sides: Up == Right, and Right narrows a right
      // pane, so Up narrows it too. Oracle 1: the splitter's keys are
      // *directional* — they move the separator, and the value follows from
      // which pane the separator is moving into. So a key lowering
      // `aria-valuenow` on a right pane is the pattern, not a deviation from it
      // (it was one under `slider`, where ↑ is conventionally „increase"; the
      // role decision settled that — see resize-handle.mdx).
      const onValueChange = vi.fn();
      render(
        <ResizeHandle
          side="right"
          value={300}
          min={MIN}
          max={MAX}
          step={10}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      screen.getByRole("separator").focus();

      await press("ArrowUp");
      expect(onValueChange).toHaveBeenLastCalledWith(290);
      await press("ArrowDown");
      expect(onValueChange).toHaveBeenLastCalledWith(310);
    });

    it("defaults step to 10 when none is given", async () => {
      // Pins the documented default: with `step` omitted, one arrow press moves
      // by exactly 10. Every other arrow test passes `step` explicitly, so the
      // default itself was unpinned.
      const onValueChange = vi.fn();
      render(
        <ResizeHandle
          side="left"
          value={300}
          min={MIN}
          max={MAX}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      screen.getByRole("separator").focus();
      await press("ArrowRight");
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(310);
    });

    it("uses the given step", async () => {
      const onValueChange = vi.fn();
      render(
        <ResizeHandle
          side="left"
          value={300}
          min={MIN}
          max={MAX}
          step={25}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      screen.getByRole("separator").focus();
      await press("ArrowRight");
      expect(onValueChange).toHaveBeenLastCalledWith(325); // 300 + 25
    });
  });

  describe("Home/End are side-independent", () => {
    it.each(["left", "right"] as const)(
      "jumps to min on Home and to max on End (%s pane)",
      async (side) => {
        // Oracle 1: Home is the advertised minimum and End the advertised
        // maximum *value* (`aria-valuemin`/`aria-valuemax`). Both are values,
        // not directions, so the per-side mirroring must NOT apply to them.
        const onValueChange = vi.fn();
        render(
          <ResizeHandle
            side={side}
            value={300}
            min={MIN}
            max={MAX}
            label="Breite ändern"
            onValueChange={onValueChange}
          />,
        );
        screen.getByRole("separator").focus();

        await press("Home");
        expect(onValueChange).toHaveBeenLastCalledWith(MIN);
        await press("End");
        expect(onValueChange).toHaveBeenLastCalledWith(MAX);
      },
    );
  });

  it("clamps at the bounds however long the key is held", async () => {
    // Oracle 1: aria-valuenow must stay within [min, max]. Ten steps of 10 from
    // 590 would reach 690 unclamped; the bound is 600.
    const onValueChange = vi.fn();
    render(
      <ControlledHandle side="left" initial={590} onValueChange={onValueChange} />,
    );
    const handle = screen.getByRole("separator");
    handle.focus();

    for (let i = 0; i < 10; i += 1) await press("ArrowRight");
    expect(handle).toHaveAttribute("aria-valuenow", String(MAX));

    for (let i = 0; i < 100; i += 1) await press("ArrowLeft");
    expect(handle).toHaveAttribute("aria-valuenow", String(MIN));

    // No call ever left the advertised range.
    expect(
      onValueChange.mock.calls.every(([v]) => v >= MIN && v <= MAX),
    ).toBe(true);
  });

  it("ignores keys it does not own", async () => {
    // ArrowUp/ArrowDown were listed here while they were no-ops; they are now
    // part of the contract (see the axis tests) and were removed from this list.
    const onValueChange = vi.fn();
    render(
      <ResizeHandle
        side="left"
        value={300}
        min={MIN}
        max={MAX}
        label="Breite ändern"
        onValueChange={onValueChange}
      />,
    );
    screen.getByRole("separator").focus();
    await press("Enter");
    await press("PageUp");
    await press("PageDown");
    await press("Escape");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  describe("pointer drag (owned by the handle)", () => {
    it("reports the dragged width and brackets it with start/end", () => {
      const onValueChange = vi.fn();
      const onResizeStart = vi.fn();
      const onResizeEnd = vi.fn();
      render(
        <ResizeHandle
          side="left"
          value={300}
          min={MIN}
          max={MAX}
          label="Breite ändern"
          onValueChange={onValueChange}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
        />,
      );
      const handle = screen.getByRole("separator");

      fireEvent.pointerDown(handle, { button: 0, clientX: 500 });
      expect(onResizeStart).toHaveBeenCalledTimes(1);

      fireEvent.pointerMove(window, { clientX: 540 });
      // Oracle 2: pointer moved 40px right, left pane widens by 40 → 340.
      expect(onValueChange).toHaveBeenLastCalledWith(340);

      fireEvent.pointerUp(window);
      expect(onResizeEnd).toHaveBeenCalledTimes(1);

      // After the drag ends the handle must not still be listening.
      onValueChange.mockClear();
      fireEvent.pointerMove(window, { clientX: 900 });
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("mirrors the drag for a right pane", () => {
      const onValueChange = vi.fn();
      render(
        <ResizeHandle
          side="right"
          value={300}
          min={MIN}
          max={MAX}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      fireEvent.pointerDown(screen.getByRole("separator"), {
        button: 0,
        clientX: 500,
      });
      fireEvent.pointerMove(window, { clientX: 540 });
      // Oracle 2: same 40px to the right, right pane gets NARROWER → 260.
      expect(onValueChange).toHaveBeenLastCalledWith(260);
      fireEvent.pointerUp(window);
    });

    it("clamps the drag and reports each width once", () => {
      const onValueChange = vi.fn();
      render(
        <ResizeHandle
          side="left"
          value={300}
          min={MIN}
          max={MAX}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      fireEvent.pointerDown(screen.getByRole("separator"), {
        button: 0,
        clientX: 500,
      });
      fireEvent.pointerMove(window, { clientX: 1500 }); // 300 + 1000 → clamped
      fireEvent.pointerMove(window, { clientX: 1600 }); // still past the bound
      fireEvent.pointerMove(window, { clientX: 500 }); // back to the start
      fireEvent.pointerUp(window);

      // Oracle 1 + 2: clamped to max, no duplicate report while pinned at the
      // bound, and the return to the starting position is reported (300 was the
      // width at pointerdown, so a naive stale-prop comparison would swallow it).
      expect(onValueChange.mock.calls.map(([v]) => v)).toEqual([MAX, 300]);
    });

    it("follows a bound that moves during the drag, in the same gesture", () => {
      const onValueChange = vi.fn();
      const handle = (max: number) => (
        <ResizeHandle side="left" value={300} min={200} max={max} label="Breite ändern" onValueChange={onValueChange} />
      );
      const { rerender } = render(handle(400));
      fireEvent.pointerDown(screen.getByRole("separator"), { button: 0, clientX: 500 });
      fireEvent.pointerMove(window, { clientX: 700 }); // 500 → clamped to 400
      // The frame frees room mid-drag (a column folds): the bound grows.
      rerender(handle(600));
      fireEvent.pointerMove(window, { clientX: 750 }); // 550, inside the new bound
      fireEvent.pointerUp(window);
      expect(onValueChange.mock.calls.map(([v]) => v)).toEqual([400, 550]);
    });

    it("takes focus, so the arrow keys work right after a drag", async () => {
      // Oracle 1: the splitter is a keyboard widget in the tab order, and its
      // keys only apply while it has focus — so a pointer drag that left focus
      // elsewhere would strand the user on a widget they just used. (Native
      // range inputs focus on press for the same reason.) Suppressing the text
      // selection on pointerdown also suppresses the default focus, so this is
      // a real trap.
      const onValueChange = vi.fn();
      render(
        <ResizeHandle
          side="left"
          value={300}
          min={MIN}
          max={MAX}
          step={10}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      const handle = screen.getByRole("separator");
      fireEvent.pointerDown(handle, { button: 0, clientX: 500 });
      fireEvent.pointerUp(window);
      expect(handle).toHaveFocus();

      await press("ArrowRight");
      expect(onValueChange).toHaveBeenLastCalledWith(310);
    });

    it("ignores non-primary buttons", () => {
      const onResizeStart = vi.fn();
      render(
        <ResizeHandle
          side="left"
          value={300}
          min={MIN}
          max={MAX}
          label="Breite ändern"
          onValueChange={() => {}}
          onResizeStart={onResizeStart}
        />,
      );
      fireEvent.pointerDown(screen.getByRole("separator"), {
        button: 2,
        clientX: 500,
      });
      expect(onResizeStart).not.toHaveBeenCalled();
    });

    it("stops listening when unmounted mid-drag", () => {
      const onValueChange = vi.fn();
      const { unmount } = render(
        <ResizeHandle
          side="left"
          value={300}
          min={MIN}
          max={MAX}
          label="Breite ändern"
          onValueChange={onValueChange}
        />,
      );
      fireEvent.pointerDown(screen.getByRole("separator"), {
        button: 0,
        clientX: 500,
      });
      unmount();
      fireEvent.pointerMove(window, { clientX: 540 });
      // Oracle: a removed component may not keep driving consumer state — React
      // warns on exactly this, and the listener would leak.
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });
});
