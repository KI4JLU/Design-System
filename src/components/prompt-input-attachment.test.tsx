import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  type PromptInputAttachmentStatus,
} from "./prompt-input";

// jsdom has no object URLs; the chip only needs some string.
beforeEach(() => {
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:test", revokeObjectURL: () => {} }));
});
afterEach(() => vi.unstubAllGlobals());

function Composer({ status, statusMessage }: { status?: PromptInputAttachmentStatus; statusMessage?: string }) {
  return (
    <PromptInput onSubmit={() => {}}>
      <PromptInputAttachments>
        {(file) => <PromptInputAttachment data={file} status={status} statusMessage={statusMessage} />}
      </PromptInputAttachments>
    </PromptInput>
  );
}

function attach(container: HTMLElement, name = "ordnung.pdf") {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("no file input");
  fireEvent.change(input, { target: { files: [new File(["x"], name, { type: "application/pdf" })] } });
}

const chip = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-slot="prompt-input-attachments"] > div');

describe("PromptInputAttachment status", () => {
  it("renders the plain chip without a status", () => {
    const { container } = render(<Composer />);
    attach(container);
    const el = chip(container);
    expect(el).not.toBeNull();
    expect(el).not.toHaveAttribute("aria-busy");
    expect(el).not.toHaveAttribute("data-status");
    expect(el?.textContent).toBe("ordnung.pdfRemove");
  });

  it("marks an uploading chip busy and reads the status out", () => {
    const { container } = render(<Composer status="uploading" />);
    attach(container);
    const el = chip(container);
    expect(el).toHaveAttribute("aria-busy", "true");
    expect(el).toHaveAttribute("data-status", "uploading");
    expect(screen.getByText(": Uploading")).toHaveClass("sr-only");
  });

  it("tones an error chip and reads the consumer's message out", () => {
    const { container } = render(<Composer status="error" statusMessage="Datei zu groß" />);
    attach(container);
    const el = chip(container);
    expect(el).toHaveAttribute("data-status", "error");
    expect(el?.className).toContain("border-error");
    expect(screen.getByText(": Datei zu groß")).toHaveClass("sr-only");
  });
});
