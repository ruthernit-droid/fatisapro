import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-indigo-100 text-indigo-700 border-indigo-200",
        secondary: "bg-neutral-100 text-neutral-700 border-neutral-200",
        destructive: "bg-red-100 text-red-700 border-red-200",
        outline: "bg-transparent text-neutral-700 border-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  style?: React.CSSProperties;
}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      style={style}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
