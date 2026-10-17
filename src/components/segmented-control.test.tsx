import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LayoutGrid, List } from "lucide-react";
import { SegmentedControl } from "./segmented-control";

const OPTIONS = [
  { value: "tag", label: "Tag" },
  { value: "woche", label: "Woche" },
  { value: "monat", label: "Monat" },
];

describe("SegmentedControl", () => {
  it("renders all segments and marks the active one via aria-pressed", () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="woche"
        onValueChange={() => {}}
        aria-label="Zeitraum"
      />,
    );
    expect(screen.getByRole("group", { name: "Zeitraum" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Woche" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Tag" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports the clicked segment via onValueChange", async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="woche"
        onValueChange={onValueChange}
        aria-label="Zeitraum"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Monat" }));
    expect(onValueChange).toHaveBeenCalledWith("monat");
  });

  it("is keyboard operable", async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="tag"
        onValueChange={onValueChange}
        aria-label="Zeitraum"
      />,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Tag" })).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("woche");
  });

  /* Icon-only segments (0.33.0), added for JustRAG's card/list view toggle.
   *
   * ORACLE: WAI-ARIA's accessible-name computation as testing-library resolves
   * it. „The icon replaced the text" and „the button still has a name" are the
   * two halves that must BOTH hold — an icon-only control whose label was
   * dropped rather than hidden is announced as "button", which is the failure
   * this pair exists to catch and which a screenshot would never show.
   */
  describe("icon-only segments", () => {
    const ICONS = [
      { value: "card", label: "Karten", icon: <LayoutGrid aria-hidden /> },
      { value: "list", label: "Liste", icon: <List aria-hidden /> },
    ];

    it("keeps the label as the accessible name when an icon replaces it", () => {
      render(
        <SegmentedControl
          options={ICONS}
          value="card"
          onValueChange={() => {}}
          aria-label="Ansicht"
        />,
      );

      // Named, and addressable by the word a user would say.
      expect(screen.getByRole("button", { name: "Karten" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Liste" })).toHaveAttribute("aria-pressed", "false");
    });

    it("hides the label text rather than dropping it", () => {
      const { container } = render(
        <SegmentedControl
          options={ICONS}
          value="card"
          onValueChange={() => {}}
          aria-label="Ansicht"
        />,
      );

      /* The text is IN the document — that is what names the button — but
         carries the sr-only class, so it is not what the eye reads. Asserting
         the class is unusual here and deliberate: it is the one mechanism that
         distinguishes "hidden" from "deleted", and jsdom applies no stylesheet
         to tell them apart any other way. */
      const hidden = container.querySelector(".sr-only");
      expect(hidden).not.toBeNull();
      expect(hidden).toHaveTextContent("Karten");
      // And the icon is there to be seen in its place.
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("still reports the value when an icon segment is pressed", async () => {
      const onValueChange = vi.fn();
      render(
        <SegmentedControl
          options={ICONS}
          value="card"
          onValueChange={onValueChange}
          aria-label="Ansicht"
        />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Liste" }));
      expect(onValueChange).toHaveBeenCalledWith("list");
    });
  });

  /* Icon + visible label (`showLabel`).
   *
   * ORACLE: the same accessible-name computation, plus the rendered text — the
   * label must be both the name AND visible (not inside an sr-only span), and
   * an icon-only segment in the same row must stay icon-only.
   */
  describe("icon + label segments", () => {
    const MIXED = [
      { value: "single", label: "Einzeln", icon: <LayoutGrid aria-hidden />, showLabel: true },
      { value: "list", label: "Liste", icon: <List aria-hidden /> },
    ];

    it("shows the label next to the icon and keeps it as the name", () => {
      render(
        <SegmentedControl options={MIXED} value="single" onValueChange={() => {}} aria-label="Modus" />,
      );
      const labelled = screen.getByRole("button", { name: "Einzeln" });
      expect(labelled).toHaveAttribute("aria-pressed", "true");
      expect(labelled.querySelector("svg")).not.toBeNull();
      const text = Array.from(labelled.querySelectorAll("span")).find((el) => el.textContent === "Einzeln");
      expect(text).toBeDefined();
      expect(text).not.toHaveClass("sr-only");
      expect(labelled).not.toHaveClass("w-9");
    });

    it("leaves an icon-only segment in the same row icon-only", () => {
      render(
        <SegmentedControl options={MIXED} value="single" onValueChange={() => {}} aria-label="Modus" />,
      );
      const iconOnly = screen.getByRole("button", { name: "Liste" });
      expect(iconOnly.querySelector(".sr-only")).toHaveTextContent("Liste");
      expect(iconOnly).toHaveClass("w-9");
    });

    it("has no effect without an icon", () => {
      render(
        <SegmentedControl
          options={[{ value: "a", label: "Alpha", showLabel: true }]}
          value="a"
          onValueChange={() => {}}
          aria-label="X"
        />,
      );
      const button = screen.getByRole("button", { name: "Alpha" });
      expect(button).toHaveClass("px-4", "py-2");
      expect(button.querySelector(".sr-only")).toBeNull();
    });

    it("reports the value when pressed", async () => {
      const onValueChange = vi.fn();
      render(
        <SegmentedControl options={MIXED} value="list" onValueChange={onValueChange} aria-label="Modus" />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Einzeln" }));
      expect(onValueChange).toHaveBeenCalledWith("single");
    });
  });
});
