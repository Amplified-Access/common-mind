"use client";

import { Toaster as Sonner } from "sonner";

// Site-wide toasts, styled like the site's cards: warm dark panel, hairline
// edge, mono text. Call `toast.error(...)` / `toast.success(...)` from "sonner".
function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-3 rounded-card border border-[#1e1c19] bg-[#1c1a0e] px-4 py-3.5 font-mono text-xs text-foreground shadow-[0_8px_30px_rgb(0_0_0/0.5)] sm:w-96",
          title: "leading-relaxed",
          description: "text-subtle",
          icon: "mt-px",
          error: "[&_[data-icon]]:text-destructive",
          success: "[&_[data-icon]]:text-signal",
        },
      }}
    />
  );
}

export { Toaster };
