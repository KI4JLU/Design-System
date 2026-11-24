import { describe, expect, it } from "vitest";
import { foldText, matchPdfText } from "./pdf-text-match";

// Oracle: the marked characters, read back off the items by hand. Each case
// is one way pdf.js text differs from the extracted passage a caller passes.
const marked = (items: { str: string }[], queries: string[]) =>
  matchPdfText(items, queries).map((r) => items[r.item].str.slice(r.start, r.end));

describe("matchPdfText", () => {
  it("finds a passage split across items, spacing only by position", () => {
    const items = [{ str: "Eine nicht be" }, { str: "standene" }, { str: "Prüfung kann" }, { str: " zweimal wiederholt werden." }];
    expect(marked(items, ["Eine nicht bestandene Prüfung kann zweimal wiederholt werden."])).toEqual([
      // A mark starts and ends on folded text: the leading space stays unmarked.
      "Eine nicht be", "standene", "Prüfung kann", "zweimal wiederholt werden.",
    ]);
  });

  it("marks only the matched part of an item", () => {
    const items = [{ str: "§ 2 Regelstudienzeit Die Regelstudienzeit beträgt vier Semester." }];
    expect(marked(items, ["beträgt vier Semester"])).toEqual(["beträgt vier Semester"]);
  });

  it("ignores line-end hyphenation and Markdown in the passage", () => {
    const items = [{ str: "Die Bearbeitungszeit der Master-" }, { str: "arbeit beträgt sechs Monate." }];
    expect(marked(items, ["**Die Bearbeitungszeit der Masterarbeit** beträgt sechs Monate."])).toEqual([
      // The line-end hyphen is not part of the word, so not of the mark.
      "Die Bearbeitungszeit der Master", "arbeit beträgt sechs Monate.",
    ]);
  });

  it("falls back to sentences when the passage is not on the page whole", () => {
    const items = [{ str: "Die Wiederholung findet im folgenden Semester statt." }];
    const passage = "Eine nicht bestandene Prüfung kann zweimal wiederholt werden. Die Wiederholung findet im folgenden Semester statt.";
    expect(marked(items, [passage])).toEqual(["Die Wiederholung findet im folgenden Semester statt."]);
  });

  it("skips sentences too short to be told apart from chance", () => {
    expect(marked([{ str: "Ja. Nein. Vielleicht." }], ["Ja. Nein. Etwas anderes als hier."])).toEqual([]);
  });

  it("keeps offsets right after an astral character (emoji, math letters)", () => {
    const items = [{ str: "😀 alpha beta gamma delta" }];
    expect(marked(items, ["alpha beta gamma delta"])).toEqual(["alpha beta gamma delta"]);
  });

  it("marks each page's part of a sentence that breaks across pages", () => {
    const sentence = "Die Länder tragen gemeinsam dafür Sorge, dass die Gleichwertigkeit gewährleistet wird.";
    const first = [{ str: "Text davor. Die Länder tragen gemeinsam dafür Sorge," }];
    const second = [{ str: "dass die Gleichwertigkeit gewährleistet wird. Danach geht es weiter." }];
    expect(marked(first, [sentence])).toEqual(["Die Länder tragen gemeinsam dafür Sorge,"]);
    expect(marked(second, [sentence])).toEqual(["dass die Gleichwertigkeit gewährleistet wird."]);
  });

  it("finds nothing for text that is not there", () => {
    expect(marked([{ str: "§ 1 Geltungsbereich" }], ["Diese Ordnung gilt nicht."])).toEqual([]);
  });
});

describe("foldText", () => {
  it("drops whitespace, dashes and Markdown marks, folds ligatures and case", () => {
    expect(foldText("**Efﬁzienz** – Ab-\nschnitt")).toBe("effizienzabschnitt");
  });
});
