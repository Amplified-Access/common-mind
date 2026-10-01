"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  html: string;
  title?: string;
  className?: string;
};

function CodeBlock({ code, html, title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-3xl bg-surface text-[13px] leading-relaxed [&_code]:font-mono [&_pre]:overflow-x-auto [&_pre]:px-7 [&_pre]:pt-2 [&_pre]:pb-7",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 px-7 pt-5 pb-2">
        <span className="truncate font-mono text-xs text-faint">
          {title ?? " "}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 cursor-pointer font-mono text-xs text-faint transition-colors hover:text-foreground"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export { CodeBlock };
