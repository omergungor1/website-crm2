/**
 * Lightweight note markdown for roadmap sticky notes.
 * Supported:
 *   # / ## / ### headings
 *   [] / [x] todos (also - [ ] / - [x])
 *   - / * bullets
 *   1. numbered lists
 *   > toggle blocks (body = indented or following lines until blank)
 *   "" quotes
 *   --- divider
 */

const HEADING_RE = /^(#{1,3})\s+(.*)$/;
// [] / [ ] / [x] / [X] — boş köşeli parantez de todo sayılır
const TODO_RE = /^(?:[-*]\s+)?\[([ xX]?)\]\s+(.*)$/;
const BULLET_RE = /^[-*]\s+(.*)$/;
const NUMBERED_RE = /^(\d+)\.\s+(.*)$/;
const TOGGLE_RE = /^>\s+(.*)$/;
const QUOTE_RE = /^""\s+(.*)$/;
const DIVIDER_RE = /^---\s*$/;
const INDENT_RE = /^(?: {2}|\t)(.*)$/;

function isBlank(line) {
  return !String(line || "").trim();
}

function startsBlock(line) {
  const t = String(line || "");
  return (
    HEADING_RE.test(t) ||
    TODO_RE.test(t) ||
    BULLET_RE.test(t) ||
    NUMBERED_RE.test(t) ||
    TOGGLE_RE.test(t) ||
    QUOTE_RE.test(t) ||
    DIVIDER_RE.test(t)
  );
}

function takeIndentedOrUntilBlank(lines, startIndex) {
  const body = [];
  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) break;
    const indented = line.match(INDENT_RE);
    if (indented) {
      body.push({ text: indented[1], lineIndex: i });
      i += 1;
      continue;
    }
    if (startsBlock(line)) break;
    body.push({ text: line, lineIndex: i });
    i += 1;
  }
  return { body, nextIndex: i };
}

/**
 * @param {string} source
 * @returns {Array<object>}
 */
export function parseNoteMarkdown(source) {
  const lines = String(source || "").split("\n");
  const blocks = [];
  let i = 0;
  let paragraphLines = [];

  function flushParagraph() {
    if (!paragraphLines.length) return;
    blocks.push({
      type: "paragraph",
      lines: paragraphLines.map((p) => ({ text: p.text, lineIndex: p.lineIndex })),
    });
    paragraphLines = [];
  }

  while (i < lines.length) {
    const line = lines[i];
    const lineIndex = i;

    if (isBlank(line)) {
      flushParagraph();
      i += 1;
      continue;
    }

    const divider = line.match(DIVIDER_RE);
    if (divider) {
      flushParagraph();
      blocks.push({ type: "divider", lineIndex });
      i += 1;
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
        lineIndex,
      });
      i += 1;
      continue;
    }

    const todo = line.match(TODO_RE);
    if (todo) {
      flushParagraph();
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(TODO_RE);
        if (!m) break;
        items.push({
          checked: String(m[1] || "").toLowerCase() === "x",
          text: m[2],
          lineIndex: i,
        });
        i += 1;
      }
      blocks.push({ type: "todo", items });
      continue;
    }

    const bullet = line.match(BULLET_RE);
    if (bullet) {
      flushParagraph();
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(BULLET_RE);
        if (!m) break;
        // skip if it's actually a todo disguised — already handled above
        if (TODO_RE.test(lines[i])) break;
        items.push({ text: m[1], lineIndex: i });
        i += 1;
      }
      blocks.push({ type: "bullet", items });
      continue;
    }

    const numbered = line.match(NUMBERED_RE);
    if (numbered) {
      flushParagraph();
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(NUMBERED_RE);
        if (!m) break;
        items.push({ n: m[1], text: m[2], lineIndex: i });
        i += 1;
      }
      blocks.push({ type: "numbered", items });
      continue;
    }

    const toggle = line.match(TOGGLE_RE);
    if (toggle) {
      flushParagraph();
      i += 1;
      const { body, nextIndex } = takeIndentedOrUntilBlank(lines, i);
      blocks.push({
        type: "toggle",
        title: toggle[1],
        lineIndex,
        body,
      });
      i = nextIndex;
      continue;
    }

    const quote = line.match(QUOTE_RE);
    if (quote) {
      flushParagraph();
      const parts = [{ text: quote[1], lineIndex }];
      i += 1;
      while (i < lines.length) {
        const q = lines[i].match(QUOTE_RE);
        if (q) {
          parts.push({ text: q[1], lineIndex: i });
          i += 1;
          continue;
        }
        const indented = lines[i].match(INDENT_RE);
        if (indented) {
          parts.push({ text: indented[1], lineIndex: i });
          i += 1;
          continue;
        }
        break;
      }
      blocks.push({ type: "quote", lines: parts });
      continue;
    }

    paragraphLines.push({ text: line, lineIndex });
    i += 1;
  }

  flushParagraph();
  return blocks;
}

/**
 * Toggle a todo checkbox at a source line index.
 * @param {string} source
 * @param {number} lineIndex
 * @returns {string}
 */
export function toggleNoteTodoAtLine(source, lineIndex) {
  const lines = String(source || "").split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) return source;

  const line = lines[lineIndex];
  const m = line.match(TODO_RE);
  if (!m) return source;

  const checked = String(m[1] || "").toLowerCase() === "x";
  const nextMark = checked ? "" : "x";
  const prefix = line.match(/^[-*]\s+/) ? line.match(/^[-*]\s+/)[0] : "";
  lines[lineIndex] = `${prefix}[${nextMark}] ${m[2]}`;
  return lines.join("\n");
}

export const NOTE_MARKDOWN_HINTS = [
  { syn: "# ", desc: "H1 büyük başlık" },
  { syn: "## ", desc: "H2 orta başlık" },
  { syn: "### ", desc: "H3 küçük başlık" },
  { syn: "[] ", desc: "Yapılacaklar listesi" },
  { syn: "[x] ", desc: "Tamamlanmış görev" },
  { syn: "- ", desc: "Maddeli liste" },
  { syn: "1. ", desc: "Numaralı liste" },
  { syn: "> ", desc: "Açılır-kapanır blok" },
  { syn: '"" ', desc: "Alıntı bloğu" },
  { syn: "---", desc: "Ayırıcı çizgi" },
];
