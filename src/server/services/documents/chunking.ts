export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
}

export interface ChunkingOptions {
  chunkSize?: number;
  overlap?: number;
}

export const DEFAULT_CHUNK_SIZE = 1200;
export const DEFAULT_OVERLAP = 200;

const PARAGRAPH_SEPARATOR = /\n{2,}/;

function tokenEstimate(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function overlapTail(text: string, overlap: number): string {
  if (text.length <= overlap) {
    return text;
  }
  const start = text.length - overlap;
  const spaceIndex = text.lastIndexOf(" ", start);
  const from = spaceIndex > start ? spaceIndex + 1 : start;
  return text.slice(from);
}

function splitParagraph(paragraph: string, chunkSize: number): string[] {
  if (paragraph.length <= chunkSize) {
    return [paragraph];
  }

  const lines = paragraph
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length > 1) {
    return lines.flatMap((line) => splitParagraph(line, chunkSize));
  }

  const parts: string[] = [];
  let rest = paragraph;
  while (rest.length > chunkSize) {
    let cut = chunkSize;
    const spaceIndex = rest.lastIndexOf(" ", chunkSize);
    if (spaceIndex > chunkSize * 0.5) {
      cut = Math.min(chunkSize, spaceIndex + 1);
    }
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest.length > 0) {
    parts.push(rest);
  }
  return parts;
}

export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  const paragraphs = text
    .split(PARAGRAPH_SEPARATOR)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const units = paragraphs.flatMap((paragraph) =>
    splitParagraph(paragraph, chunkSize)
  );
  if (units.length === 0) {
    return [];
  }

  const packed: string[] = [];
  let current = "";
  for (const unit of units) {
    const candidate = current.length === 0 ? unit : `${current}\n\n${unit}`;
    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      packed.push(current);
      current = unit;
    }
  }
  if (current.length > 0) {
    packed.push(current);
  }

  const chunks: string[] = [];
  for (let i = 0; i < packed.length; i++) {
    let content = packed[i];
    if (i > 0 && overlap > 0) {
      const tail = overlapTail(packed[i - 1], overlap);
      if (tail.length > 0) {
        content = `${tail}\n\n${content}`.slice(0, chunkSize).trim();
      }
    }
    chunks.push(content);
  }

  return chunks.map((content, index) => ({
    index,
    content,
    tokenCount: tokenEstimate(content),
  }));
}
