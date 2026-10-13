import { describe, expect, it } from "vitest";
import { fieldFrameClassName, fieldVariants } from "./field-variants";

/*
 * Keeps `fieldFrameClassName`'s state list in step with `fieldVariants`'
 * default. The two cannot share literal strings (Tailwind only compiles class
 * names written out in full), so this test is what ties them together.
 *
 * Oracle: the hand-written table below, which states what each element-level
 * state becomes on a frame around the input. It is a CSS selector equivalence
 * (`:focus-visible` on the field ↔ `:has(input:focus-visible)` on its frame),
 * not something read from either class string. For each state token, the set
 * of states it appears under in `fieldVariants`, translated through the table,
 * must equal the set it appears under in the frame.
 */
const ELEMENT_TO_FRAME: Record<string, string> = {
  "focus-visible:": "has-[input:focus-visible]:",
  "aria-[invalid=true]:": "has-[input[aria-invalid=true]]:",
  "aria-[invalid=true]:focus-visible:": "has-[input[aria-invalid=true]:focus-visible]:",
  "disabled:": "has-[input:disabled]:",
};

const STATE_TOKENS = [
  "border-primary",
  "ring-focus-ring",
  "border-error",
  "ring-error",
  "cursor-not-allowed",
  "opacity-60",
];

/** The prefixes (state variants) under which `token` appears in `classes`. */
const prefixesOf = (classes: string, token: string) =>
  classes
    .split(/\s+/)
    .filter((cls) => cls.endsWith(`:${token}`))
    .map((cls) => cls.slice(0, -token.length))
    .sort();

describe("fieldFrameClassName", () => {
  const field = fieldVariants({ variant: "default" });

  it.each(STATE_TOKENS)("applies %s in the same states as the framed field", (token) => {
    const onField = prefixesOf(field, token);
    // The token is a state token of the field at all (guards the list itself).
    expect(onField.length).toBeGreaterThan(0);
    const expected = onField.map((prefix) => {
      expect(ELEMENT_TO_FRAME).toHaveProperty([prefix]);
      return ELEMENT_TO_FRAME[prefix];
    });
    expect(prefixesOf(fieldFrameClassName, token)).toEqual(expected.sort());
  });

  it("shares the field's resting surface", () => {
    for (const cls of ["rounded-field", "border", "border-outline-variant", "bg-surface-container-lowest"]) {
      expect(field.split(/\s+/)).toContain(cls);
      expect(fieldFrameClassName.split(/\s+/)).toContain(cls);
    }
  });
});
