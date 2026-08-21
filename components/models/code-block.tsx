"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  html: string;
  className?: string;
};

function CodeBlock({ code, html, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl text-sm leading-relaxed [&_code]:font-mono [&_pre]:overflow-x-auto [&_pre]:p-6",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3 right-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export { CodeBlock };
