import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogEyebrow, DialogFooter, DialogTitle } from "./dialog";

function renderDialog(closeLabel?: string) {
  return render(
    <Dialog open>
      <DialogContent aria-describedby={undefined} closeLabel={closeLabel}>
        <DialogTitle>Titel</DialogTitle>
      </DialogContent>
    </Dialog>,
  );
}

describe("DialogContent", () => {
  it("labels the built-in close button 'Schließen' by default", () => {
    renderDialog();
    expect(
      screen.getByRole("button", { name: "Schließen" }),
    ).toBeInTheDocument();
  });

  it("closeLabel overrides the close button's accessible name", () => {
    renderDialog("Close");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Schließen" }),
    ).not.toBeInTheDocument();
  });
});

describe("DialogContent showClose", () => {
  it("renders the close button by default and leaves it out on request", () => {
    const { rerender } = render(
      <Dialog open>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Titel</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("button", { name: "Schließen" })).toBeInTheDocument();
    rerender(
      <Dialog open>
        <DialogContent aria-describedby={undefined} showClose={false}>
          <DialogTitle>Titel</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByRole("button", { name: "Schließen" })).toBeNull();
  });
});

describe("DialogFooter layout", () => {
  it("defaults to end and switches to the equal-halves grid with fill", () => {
    render(
      <Dialog open>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>T</DialogTitle>
          <DialogEyebrow>Status</DialogEyebrow>
          <DialogFooter data-testid="end">a</DialogFooter>
          <DialogFooter data-testid="fill" layout="fill">b</DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByTestId("end")).toHaveAttribute("data-layout", "end");
    expect(screen.getByTestId("fill")).toHaveAttribute("data-layout", "fill");
    expect(screen.getByTestId("fill")).toHaveClass("sm:grid-cols-2");
    expect(screen.getByText("Status")).toHaveAttribute("data-slot", "dialog-eyebrow");
  });
});
