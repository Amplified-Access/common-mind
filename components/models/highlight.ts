import { codeToHtml } from "shiki";

function highlightCode(code: string, lang: string) {
  return codeToHtml(code, {
    lang,
    theme: "vesper",
    // Keep code on-palette: Vesper's mint strings become a warm neutral so
    // the golden accent stays the only accent.
    colorReplacements: { "#99ffe4": "#d8ccb0", "#99FFE4": "#d8ccb0" },
  });
}

export { highlightCode };
