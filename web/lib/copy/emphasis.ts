// Copy marks the words a heading highlights with stars: "Civic discourse is
// *multilingual*". A star without its pair stays as written.

export type EmphasisPart = { text: string; em: boolean };

export function splitEmphasis(text: string): EmphasisPart[] {
  const parts: EmphasisPart[] = [];
  const pattern = /\*([^*]+)\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), em: false });
    parts.push({ text: match[1], em: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), em: false });
  return parts;
}
