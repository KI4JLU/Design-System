import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

// Oracle: the WAI-ARIA alertdialog pattern and the component's doc comment —
// role alertdialog named by its title and described by every paragraph of the
// description, no close button, and a dialog the app keeps open stays open on
// Escape.

function Notice({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hinweis</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>Erster Absatz.</p>
              <p>Zweiter Absatz.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abmelden</AlertDialogCancel>
          <AlertDialogAction>Akzeptieren</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe("AlertDialog", () => {
  it("is an alertdialog named by its title and described by all paragraphs", () => {
    render(<Notice />);
    const dialog = screen.getByRole("alertdialog", { name: "Hinweis" });
    expect(dialog).toHaveAccessibleDescription("Erster Absatz. Zweiter Absatz.");
  });

  it("has no close button besides its actions", () => {
    render(<Notice />);
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Abmelden", "Akzeptieren"]);
  });

  it("stays open on Escape while the app keeps it open", () => {
    const onOpenChange = vi.fn();
    render(<Notice onOpenChange={onOpenChange} />);
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
