import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-10", {
  variants: {
    size: {
      sm: "max-w-3xl",
      default: "max-w-5xl",
      lg: "max-w-7xl",
      xl: "max-w-[1520px]",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

function Container({
  className,
  size = "xl",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
  return (
    <div
      data-slot="container"
      className={cn(containerVariants({ size, className }))}
      {...props}
    />
  );
}

export { Container, containerVariants };
