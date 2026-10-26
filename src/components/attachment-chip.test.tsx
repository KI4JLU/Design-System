import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
