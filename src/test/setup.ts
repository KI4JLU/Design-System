import "@testing-library/jest-dom/vitest";

// jsdom lacks a few browser APIs that Radix popper-positioned components
// (DropdownMenu, Popover, Select) require. Minimal no-op polyfills — the
// tests assert roles/keyboard behavior, not geometry.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// Embla (Carousel) observes its slides; jsdom has no IntersectionObserver.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??= IntersectionObserverStub as unknown as typeof IntersectionObserver;
// …and reads its breakpoint options through matchMedia, which jsdom lacks too.
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

Element.prototype.scrollIntoView ??= () => {};

// Node ≥22 exposes a global `localStorage` that shadows jsdom's Storage and
// is unusable without `--localstorage-file`. Replace it with a working
// in-memory implementation so the standard API behaves in tests.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  } as Storage;
}

function storageWorks(): boolean {
  try {
    localStorage.setItem("__probe__", "1");
    const ok = localStorage.getItem("__probe__") === "1";
    localStorage.removeItem("__probe__");
    return ok && typeof localStorage.clear === "function";
  } catch {
    return false;
  }
}

if (!storageWorks()) {
  const memoryStorage = createMemoryStorage();
  for (const target of [globalThis, window]) {
    Object.defineProperty(target, "localStorage", {
      value: memoryStorage,
      configurable: true,
      writable: true,
    });
  }
}
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
