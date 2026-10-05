import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import type { DialogContentProps } from "./dialog";

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

describe("DialogContent size", () => {
  const renderSized = (size?: DialogContentProps["size"]) =>
    render(
      <Dialog open>
        <DialogContent aria-describedby={undefined} size={size}>
          <DialogTitle>Titel</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

  it.each([
    [undefined, "max-w-lg"],
    ["sm", "max-w-sm"],
    ["default", "max-w-lg"],
    ["lg", "max-w-2xl"],
    ["xl", "max-w-3xl"],
  ] as const)("size=%s → %s", (size, cls) => {
    renderSized(size);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass(cls);
    for (const other of ["max-w-sm", "max-w-lg", "max-w-2xl", "max-w-3xl"].filter((c) => c !== cls)) {
      expect(dialog).not.toHaveClass(other);
    }
  });

  it("caps the height at the viewport and scrolls as a whole by default", () => {
    renderSized();
    expect(screen.getByRole("dialog")).toHaveClass(
      "max-h-[calc(100dvh-2rem)]",
      "flex",
      "flex-col",
      "overflow-y-auto",
    );
  });

  it("lets a className override win (layout exception)", () => {
    render(
      <Dialog open>
        <DialogContent aria-describedby={undefined} className="max-w-xl">
          <DialogTitle>Titel</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("max-w-xl");
    expect(dialog).not.toHaveClass("max-w-lg");
  });
});

describe("DialogBody", () => {
  it("renders between header and footer as the shrinkable scrolling part", () => {
    render(
      <Dialog open>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Glossar bearbeiten</DialogTitle>
          </DialogHeader>
          <DialogBody data-testid="body">Inhalt</DialogBody>
          <DialogFooter>Aktionen</DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    const body = screen.getByTestId("body");
    expect(body).toHaveAttribute("data-slot", "dialog-body");
    expect(body).toHaveClass("min-h-0", "overflow-y-auto", "-mx-6", "px-6");
    expect(screen.getByRole("dialog")).toContainElement(body);
  });
});

describe("DialogHeader", () => {
  it("leaves room for the close button inside DialogContent", () => {
    render(
      <Dialog open>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader data-testid="header">
            <DialogTitle>Ein sehr langer Titel, der bis an den Schließen-Knopf reicht</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByTestId("header")).toHaveClass("px-8", "sm:pl-0");
  });

  it("adds no padding outside DialogContent, where no close button is rendered", () => {
    render(<DialogHeader data-testid="header">Titel</DialogHeader>);
    expect(screen.getByTestId("header")).not.toHaveClass("px-8");
  });
});
