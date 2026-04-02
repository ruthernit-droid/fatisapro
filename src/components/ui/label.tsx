import { cn } from "@/lib/utils";
import { LabelHTMLAttributes, forwardRef } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "text-sm font-medium text-neutral-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";

export { Label };
