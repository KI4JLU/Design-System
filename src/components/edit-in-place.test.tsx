import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Select, SelectTrigger, SelectValue } from "./select";

/*
 * Oracle: the edit-in-place contract — the field inherits the colour of the
 * text it stands in for (no colour token of its own), is marked by a dashed
 * currentColor outline, turns solid on focus, and grows with its content.
 * jsdom applies no Tailwind, so the contract pinned here is the class list
 * after `cn` resolved the conflicts with the shared field base; the rendered
 * look is pinned by the „Edit in place" stories.
 */
const classesOf = (el: HTMLElement) => el.className.split(/\s+/);

describe.each([
  ["Input", () => render(<Input variant="editable" aria-label="Feld" />)],
  ["Textarea", () => render(<Textarea variant="editable" aria-label="Feld" />)],
])("%s variant=editable", (_, renderField) => {
  it("inherits the text colour instead of setting one", () => {
    renderField();
    const classes = classesOf(screen.getByRole("textbox", { name: "Feld" }));
    expect(classes).toContain("text-inherit");
    expect(classes).not.toContain("text-on-surface");
    expect(classes).not.toContain("text-sm");
  });

  it("draws a dashed currentColor outline that turns solid on focus", () => {
    renderField();
    const classes = classesOf(screen.getByRole("textbox", { name: "Feld" }));
    expect(classes).toEqual(expect.arrayContaining(["outline-dashed", "outline-current/30", "focus-visible:outline-solid", "focus-visible:outline-current"]));
    expect(classes).not.toContain("outline-none");
  });

  it("shows the placeholder in the text colour, dimmed", () => {
    renderField();
    const classes = classesOf(screen.getByRole("textbox", { name: "Feld" }));
    expect(classes).toEqual(expect.arrayContaining(["placeholder:text-current", "placeholder:opacity-60"]));
    expect(classes).not.toContain("placeholder:text-on-surface-variant");
  });

  it("sizes to its content, with no frame or padding", () => {
    renderField();
    const classes = classesOf(screen.getByRole("textbox", { name: "Feld" }));
    expect(classes).toEqual(expect.arrayContaining(["field-sizing-content", "border-0", "bg-transparent", "p-0"]));
  });
});

describe("Textarea variant=editable", () => {
  it("has no min-height and no resize handle", () => {
    render(<Textarea variant="editable" aria-label="Feld" />);
    const classes = classesOf(screen.getByRole("textbox"));
    expect(classes).not.toContain("min-h-24");
    expect(classes).toContain("resize-none");
  });
});

describe("SelectTrigger variant=editable", () => {
  it("inherits the text and marks itself with the same outline", () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger variant="editable" aria-label="Kategorie">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    const trigger = screen.getByRole("combobox", { name: "Kategorie" });
    const classes = classesOf(trigger);
    expect(classes).toEqual(expect.arrayContaining(["text-inherit", "outline-dashed", "outline-current/30", "focus-visible:outline-solid"]));
    expect(classes).not.toContain("h-9");
    expect(classes).not.toContain("text-sm");
    // The chevron scales with the text and takes its colour.
    const chevron = trigger.querySelector("svg")!;
    expect(chevron.getAttribute("class")).toContain("size-[1em]");
    expect(chevron.getAttribute("class")).not.toContain("text-on-surface-variant");
  });
});
