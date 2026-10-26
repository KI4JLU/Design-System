import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileText } from "lucide-react";
import { PreviewBackLink, PreviewDialog } from "./preview-dialog";

describe("PreviewDialog", () => {
  it("names the dialog by its title and describes it by the subtitle", () => {
    render(
      <PreviewDialog icon={FileText} title="Bericht" subtitle="PDF · nur Lesen" onClose={() => {}}>
        <p>Inhalt</p>
      </PreviewDialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Bericht" });
    expect(dialog).toHaveAccessibleDescription("PDF · nur Lesen");
    expect(screen.getByText("Inhalt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schließen" })).toBeInTheDocument();
  });

  it("puts an input in the title's place and keeps the title as the name", () => {
    render(
      <PreviewDialog
        icon={FileText}
        title="Text einfügen"
        titleField={<input aria-label="Titel" />}
        subtitle="Markdown · neue Quelle"
        onClose={() => {}}
      >
        <p />
      </PreviewDialog>,
    );
    expect(screen.getByRole("dialog", { name: "Text einfügen" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Titel" })).toBeInTheDocument();
  });

  it("renders the back link, the footer and closes through onClose", () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    render(
      <PreviewDialog
        icon={FileText}
        title="Eintrag"
        subtitle="Markdown"
        footer={<button type="button">Speichern</button>}
        labels={{ close: "Zu" }}
        onClose={onClose}
      >
        <PreviewBackLink back={{ trail: ["Aktuelles (HRZ)"], onBack }} />
      </PreviewDialog>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Aktuelles \(HRZ\)/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Speichern" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Zu" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
