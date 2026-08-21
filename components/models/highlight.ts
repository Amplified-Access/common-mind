import { codeToHtml } from "shiki";

function highlightCode(code: string, lang: string) {
  return codeToHtml(code, { lang, theme: "github-dark" });
}

export { highlightCode };
