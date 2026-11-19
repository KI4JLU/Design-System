import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Sortable, SortableDropZone, SortableGroup, SortableItem, SortableItemHandle, SortableOverlay } from "./sortable";

/* ---------------------------------------------------------------------------
 * The empty group's drop zone and the reduced-motion path of the board.
 *
 * ORACLES: the zone's label in the DOM (present or not), read synchronously
 * right after the drag starts — before any animation frame ran — and again
 * after a frame; the cells' inline `transition`.
 * ------------------------------------------------------------------------- */

const ZONE = 'Hierher ziehen';

function Board() {
  return (
    <Sortable value={{ pinned: [], rest: ["a", "b"] }} onValueCommit={() => {}}>
      <SortableDropZone group="pinned">{ZONE}</SortableDropZone>
      <SortableGroup value="rest" items={["a", "b"]}>
        {["a", "b"].map((id) => (
          <SortableItem key={id} value={id}>
            <span>Karte {id}</span>
            <SortableItemHandle label={`Verschieben: ${id}`} />
          </SortableItem>
        ))}
      </SortableGroup>
      <SortableOverlay>{({ value }) => <div>{value}</div>}</SortableOverlay>
    </Sortable>
  );
}

function reducedMotion(on: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: on && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe('SortableDropZone', () => {
  it('is hidden while nothing is dragged', () => {
    render(<Board />);
    expect(screen.queryByText(ZONE)).toBeNull();
  });

  it('shows at once for a keyboard drag, and goes on Escape', async () => {
    render(<Board />);
    const handle = screen.getByRole('button', { name: 'Verschieben: a' });
    handle.focus();
    act(() => { fireEvent.keyDown(handle, { code: 'Space', key: ' ' }); });
    // No frame has run yet: the keyboard does not wait for one.
    expect(screen.getByText(ZONE)).toBeTruthy();
    // dnd-kit listens for the keys that move or end the drag from the next tick.
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));
    act(() => { fireEvent.keyDown(handle, { code: 'Escape', key: 'Escape' }); });
    expect(screen.queryByText(ZONE)).toBeNull();
  });

  it('shows one frame after a mouse drag starts, and goes on release', async () => {
    render(<Board />);
    const card = screen.getByText('Karte a');
    act(() => { fireEvent.mouseDown(card, { button: 0, clientX: 10, clientY: 10 }); });
    act(() => { fireEvent.mouseMove(document, { clientX: 10, clientY: 30 }); });
    // The drag has started (the cell is marked), but the zone waits a frame.
    expect(document.querySelector('[data-dragging]')).not.toBeNull();
    expect(screen.queryByText(ZONE)).toBeNull();
    await waitFor(() => expect(screen.getByText(ZONE)).toBeTruthy());
    act(() => { fireEvent.mouseUp(document, { clientX: 10, clientY: 30 }); });
    expect(screen.queryByText(ZONE)).toBeNull();
  });
});

describe('Sortable reduced motion', () => {
  const cellOf = (text: string) => screen.getByText(text).closest('[data-slot="sortable-item"]') as HTMLElement;

  it('animates the cells normally', () => {
    reducedMotion(false);
    render(<Board />);
    expect(cellOf('Karte a').style.transition).toContain('opacity');
  });

  it('drops the cell transitions with prefers-reduced-motion', () => {
    reducedMotion(true);
    render(<Board />);
    expect(cellOf('Karte a').style.transition).toBe('');
  });
});

// Oracle: the id namespace — groups register as `group:<key>`, so an item must not look like one.
describe('SortableItem value', () => {
  it('refuses an id in the groups\' namespace', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(
      <Sortable value={{ rest: ['group:a'] }} onValueCommit={() => {}}>
        <SortableGroup value="rest" items={['group:a']}>
          <SortableItem value="group:a">x</SortableItem>
        </SortableGroup>
      </Sortable>,
    )).toThrow(/must not start with "group:"/);
    spy.mockRestore();
  });
});
