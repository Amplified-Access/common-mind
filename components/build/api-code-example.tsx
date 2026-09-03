import { CodeBlock } from "@/components/models/code-block";
import { highlightCode } from "@/components/models/highlight";

type ApiCodeExampleProps = {
  label: string;
  language: string;
  code: string;
};

async function ApiCodeExample({ label, language, code }: ApiCodeExampleProps) {
  const html = await highlightCode(code, language);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <span className="text-sm font-medium tracking-widest text-gray-500 uppercase">
        {label}
      </span>
      <CodeBlock code={code} html={html} />
    </div>
  );
}

export { ApiCodeExample };
