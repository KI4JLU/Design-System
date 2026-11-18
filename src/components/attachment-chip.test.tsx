import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AttachmentChip } from "./prompt-input";
import { FilePreview } from "./file-preview";

describe("AttachmentChip", () => {
  it("is read-only without onRemove", () => {
    render(<AttachmentChip filename="notiz.txt" mediaType="text/plain" />);
    expect(screen.getByText("notiz.txt")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove attachment" })).not.toBeInTheDocument();
  });

  it("offers remove with onRemove", () => {
    const onRemove = vi.fn();
    render(<AttachmentChip filename="notiz.txt" mediaType="text/plain" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove attachment" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("shows an image's thumbnail only when it has a URL", () => {
    const { rerender } = render(<AttachmentChip filename="foto.png" mediaType="image/png" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    rerender(<AttachmentChip filename="foto.png" mediaType="image/png" url="blob:x" />);
    expect(screen.getByRole("img", { name: "foto.png" })).toHaveAttribute("src", "blob:x");
  });
});

describe("AttachmentChip preview", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const rest = (chip: HTMLElement) => {
    fireEvent.pointerEnter(chip, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(400));
  };
  const chipOf = (name: string) => screen.getByText(name).closest<HTMLElement>('[data-slot="attachment-chip"]')!;

  it("opens when the pointer rests on the chip, not when it enters", () => {
    vi.useFakeTimers();
    render(<AttachmentChip filename="notiz.txt" mediaType="text/plain" />);
    fireEvent.pointerEnter(chipOf("notiz.txt"), { pointerType: "mouse" });
    expect(document.querySelector('[data-slot="file-preview"]')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(400));
    expect(document.querySelector('[data-slot="file-preview"]')).toBeInTheDocument();
  });

  // Oracle: the name is written out under the preview only when the chip
  // cuts it off (the label is wider than its box); a name that fits is not
  // repeated.
  it("writes out a cut-off name under the preview, and only then", () => {
    vi.useFakeTimers();
    let cut = false;
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => (cut ? 300 : 100));
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 100);
    const { unmount } = render(<AttachmentChip filename="kurz.txt" mediaType="text/plain" />);
    rest(chipOf("kurz.txt"));
    expect(document.querySelector('[data-slot="attachment-chip-full-name"]')).not.toBeInTheDocument();
    unmount();

    cut = true;
    render(<AttachmentChip filename="ein-sehr-langer-dateiname.txt" mediaType="text/plain" />);
    rest(chipOf("ein-sehr-langer-dateiname.txt"));
    expect(document.querySelector('[data-slot="attachment-chip-full-name"]')).toHaveTextContent("ein-sehr-langer-dateiname.txt");
  });

  it("carries no title, so no tooltip shows with the preview", () => {
    // A consumer written before `title` left the props still compiles as JS.
    render(<AttachmentChip filename="notiz.txt" {...({ title: "notiz.txt" } as object)} />);
    expect(chipOf("notiz.txt")).not.toHaveAttribute("title");
  });
});

describe("FilePreview", () => {
  it("shows text as a miniature page and an overridden badge", () => {
    render(<FilePreview filename="notiz.md" text="# Titel\nErste Zeile" badge="MD" />);
    expect(screen.getByText(/Erste Zeile/)).toBeInTheDocument();
    expect(screen.getByText("MD")).toBeInTheDocument();
  });

  it("shows a custom body in place of the glyph", () => {
    render(<FilePreview badge="RSS"><p>12 Einträge</p></FilePreview>);
    expect(screen.getByText("12 Einträge")).toBeInTheDocument();
    expect(screen.getByText("RSS")).toBeInTheDocument();
  });
});
