/**
 * Finds passages in a PDF page's text content, for `PdfViewer`'s highlights.
 *
 * The text a caller wants marked (a cited passage, a search hit) rarely
 * matches the page's text items character for character: pdf.js splits words
 * across items, spacing is positioning rather than space characters, lines
 * end in hyphenation, and an extracted passage may carry Markdown. So both
 * sides are compared in a folded form — no whitespace, no hyphens or dashes,
 * no Markdown marks, NFKC, lower case — and every folded character keeps the
 * item and offset it came from, so a match maps back onto the items.
 *
 * A passage that is not found whole (it runs over a page break, or its text
 * was extracted differently) is retried sentence by sentence; sentences
 * shorter than `MIN_SENTENCE` folded characters are skipped, as they would
 * match by chance. A sentence that is not on the page whole either — it
 * breaks across the page — marks its longest beginning and its longest end
 * that are, so each page of a cited passage shows its own part.
 */

/** The part of a pdf.js text item the matcher reads. */
export interface PdfTextItemLike {
  str: string;
}

/** A matched stretch of one text item: `str.slice(start, end)`. */
export interface PdfTextRange {
  item: number;
  start: number;
  end: number;
}

const MIN_SENTENCE = 16;
/** Dropped before comparing: whitespace, soft hyphen, hyphens and dashes, Markdown marks. */
const DROP = /[\s­\-‐-―*_#|>`]/u;

/** Folds one character; "" when it is dropped. NFKC may expand a ligature to several. */
function fold(ch: string): string {
  if (DROP.test(ch)) return "";
  return ch.normalize("NFKC").toLowerCase().replace(/\s/gu, "");
}

/** Folds a whole string, as the page text is folded. */
export function foldText(text: string): string {
  let out = "";
  for (const ch of text) out += fold(ch);
  return out;
}

interface FoldedPage {
  text: string;
  /**
   * For each UTF-16 code unit of `text` (what `indexOf` counts): the item and
   * the offset of the source character it came from in `item.str`.
   */
  origin: [number, number][];
}

function foldPage(items: PdfTextItemLike[]): FoldedPage {
  let text = "";
  const origin: [number, number][] = [];
  items.forEach((item, i) => {
    let offset = 0;
    for (const ch of item.str) {
      const f = fold(ch);
      text += f;
      // One entry per code unit, so an astral character (two units) keeps
      // the offsets of everything after it aligned with `indexOf`.
      for (let u = 0; u < f.length; u++) origin.push([i, offset]);
      offset += ch.length;
    }
  });
  return { text, origin };
}

/** The folded range [from, to) as per-item ranges. */
function toRanges(page: FoldedPage, items: PdfTextItemLike[], from: number, to: number): PdfTextRange[] {
  const out: PdfTextRange[] = [];
  for (let k = from; k < to; k++) {
    const [item, offset] = page.origin[k];
    const end = offset + (items[item].str.codePointAt(offset)! > 0xffff ? 2 : 1);
    // Within one match, consecutive folded characters of the same item are
    // apart only by dropped ones (spaces, hyphens): one range covers them.
    const last = out[out.length - 1];
    if (last && last.item === item) last.end = Math.max(last.end, end);
    else out.push({ item, start: offset, end });
  }
  return out;
}

/**
 * The longest stretch of `needle` from its start (or, with `fromEnd`, ending
 * at its end) that occurs on the page, at least `MIN_SENTENCE` units long.
 * Occurrence is monotonic in the length, so the length is bisected.
 */
function longestEdge(page: FoldedPage, needle: string, fromEnd: boolean): string | null {
  const part = (n: number) => (fromEnd ? needle.slice(needle.length - n) : needle.slice(0, n));
  let lo = MIN_SENTENCE - 1;
  let hi = needle.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (page.text.includes(part(mid))) lo = mid;
    else hi = mid - 1;
  }
  return lo >= MIN_SENTENCE ? part(lo) : null;
}

function findAll(page: FoldedPage, needle: string): [number, number][] {
  const hits: [number, number][] = [];
  if (!needle) return hits;
  let at = page.text.indexOf(needle);
  while (at >= 0) {
    hits.push([at, at + needle.length]);
    at = page.text.indexOf(needle, at + needle.length);
  }
  return hits;
}

/**
 * The item ranges of every passage in `queries` found on the page. A passage
 * found whole marks every occurrence; otherwise each of its sentences that is
 * long enough is looked up on its own.
 */
export function matchPdfText(items: PdfTextItemLike[], queries: string[]): PdfTextRange[] {
  const page = foldPage(items);
  const spans: [number, number][] = [];
  for (const query of queries) {
    const whole = findAll(page, foldText(query));
    if (whole.length > 0) {
      spans.push(...whole);
      continue;
    }
    for (const sentence of query.split(/(?<=[.!?;:])\s+|\n+/u)) {
      const folded = foldText(sentence);
      if (folded.length < MIN_SENTENCE) continue;
      const hits = findAll(page, folded);
      if (hits.length > 0) {
        spans.push(...hits);
        continue;
      }
      // Over a page break: this page holds the sentence's start or its end.
      for (const edge of [longestEdge(page, folded, false), longestEdge(page, folded, true)]) {
        if (edge) spans.push(...findAll(page, edge));
      }
    }
  }
  return spans.flatMap(([from, to]) => toRanges(page, items, from, to));
}
