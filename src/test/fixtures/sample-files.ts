/* ---------------------------------------------------------------------------
 * Sample files for the `Components/Files` stories. Not part of the package:
 * `src/test` is excluded from the type build, and nothing in `src/index.ts`
 * imports it.
 *
 * The PDF is generated here rather than checked in as a binary: a few lines
 * of PDF 1.4 (Helvetica, WinAnsi encoding, so „ü" and „ß" render), with the
 * cross-reference offsets computed, so pdf.js parses it without the
 * reconstruction path a hand-typed file would trigger.
 * ------------------------------------------------------------------------- */

export interface SamplePage {
  title: string;
  lines: string[];
}

/** Escapes a string for a PDF literal `( … )`. */
const pdfText = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);

function pageStream({ title, lines }: SamplePage): string {
  const body = lines.map((line, i) => `${i === 0 ? "" : "T* "}(${pdfText(line)}) Tj`).join("\n");
  return [
    "BT /F1 20 Tf 72 760 Td",
    `(${pdfText(title)}) Tj`,
    "ET",
    "BT /F1 11 Tf 16 TL 72 720 Td",
    body,
    "ET",
  ].join("\n");
}

/** A PDF of the given pages as a `Blob` (A4, one title and body lines each). */
export function samplePdf(pages: SamplePage[]): Blob {
  // Object numbers: 1 catalog, 2 page tree, 3 font, then per page a page
  // object and its content stream.
  const objects: string[] = [];
  const pageIds = pages.map((_, i) => 4 + i * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  pages.forEach((page, i) => {
    const id = pageIds[i];
    const stream = pageStream(page);
    objects[id] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${id + 1} 0 R >>`;
    objects[id + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  // Latin-1, one byte per character: the offsets above count characters.
  const bytes = Uint8Array.from(pdf, (c) => c.charCodeAt(0) & 0xff);
  return new Blob([bytes], { type: "application/pdf" });
}

/**
 * Whether pdf.js has drawn text on `canvas`: some pixel is opaque and dark.
 * Size is no evidence — a fresh `<canvas>` is already 300 × 150 — and a
 * blank white page is not either; the sample pages carry black text.
 */
export function canvasHasInk(canvas: HTMLCanvasElement): boolean {
  if (canvas.width === 0 || canvas.height === 0) return false;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 200 && data[i] < 100 && data[i + 1] < 100 && data[i + 2] < 100) return true;
  }
  return false;
}

/** The three-page study regulation every file story shows. */
export const STUDY_REGULATION: SamplePage[] = [
  {
    title: "Prüfungsordnung Informatik (M.Sc.)",
    lines: [
      "§ 1 Geltungsbereich",
      "Diese Prüfungsordnung gilt für den Masterstudiengang Informatik.",
      "§ 2 Regelstudienzeit",
      "Die Regelstudienzeit beträgt vier Semester.",
    ],
  },
  {
    title: "§ 12 Wiederholung von Prüfungen",
    lines: [
      "Eine nicht bestandene Prüfung kann zweimal wiederholt werden.",
      "Die Wiederholung findet im folgenden Semester statt.",
    ],
  },
  {
    title: "§ 20 Masterarbeit",
    lines: ["Die Bearbeitungszeit der Masterarbeit beträgt sechs Monate."],
  },
];

let studyRegulationUrl: string | null = null;

/** An object URL of `STUDY_REGULATION`, created once per page load. */
export function studyRegulationPdfUrl(): string {
  studyRegulationUrl ??= URL.createObjectURL(samplePdf(STUDY_REGULATION));
  return studyRegulationUrl;
}

/** A campus site plan as an SVG data URL (840 × 560). */
export const CAMPUS_PLAN = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="560" viewBox="0 0 840 560">
    <rect width="840" height="560" fill="#eef2f0"/>
    <path d="M0 300 H840 M420 0 V560" stroke="#c9d2cd" stroke-width="28"/>
    <rect x="80" y="70" width="230" height="160" rx="10" fill="#8fb3a2"/>
    <rect x="520" y="60" width="240" height="190" rx="10" fill="#a7c4b6"/>
    <rect x="90" y="370" width="200" height="130" rx="10" fill="#b9cfc4"/>
    <rect x="530" y="360" width="220" height="150" rx="10" fill="#8fb3a2"/>
    <g font-family="sans-serif" font-size="22" fill="#1d3b2f">
      <text x="110" y="160">Hauptgebäude</text>
      <text x="560" y="160">Bibliothek</text>
      <text x="120" y="445">Mensa</text>
      <text x="560" y="445">Informatik</text>
    </g>
  </svg>`,
)}`;
