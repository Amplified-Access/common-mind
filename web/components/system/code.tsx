import { CodeBlock } from "@/components/models/code-block";
import { highlightCode } from "@/components/models/highlight";

type CodeProps = {
  code: string;
  language: string;
  title?: string;
  className?: string;
};

// Server-side highlighted code block.
async function Code({ code, language, title, className }: CodeProps) {
  const html = await highlightCode(code, language);
  return <CodeBlock code={code} html={html} title={title} className={className} />;
}

export { Code };
