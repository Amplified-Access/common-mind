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
        "relative min-w-0 overflow-hidden rounded-card border border-line bg-surface text-[13px] leading-relaxed [&_code]:font-mono [&_pre]:overflow-x-auto [&_pre]:px-6 [&_pre]:pt-2 [&_pre]:pb-8 sm:[&_pre]:px-10",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3 sm:px-10">
        <span className="truncate font-mono text-xs text-faint">{title ?? " "}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-live="polite"
          className="shrink-0 cursor-pointer rounded-full border border-line-strong bg-tag px-3.5 py-1 text-sm text-foreground transition-colors hover:border-signal hover:text-signal"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export { CodeBlock };
