import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

export function Loading({ className, size = "lg" }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-10 text-primary",
        className,
      )}
    >
      <Loader2 className={cn("animate-spin", SIZES[size])} />
    </div>
  );
}
