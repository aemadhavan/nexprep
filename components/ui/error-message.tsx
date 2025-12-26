import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  title?: string;
  message: string;
  className?: string;
}

export function ErrorMessage({ title = "Error", message, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4",
        className
      )}
    >
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-semibold text-destructive">{title}</h4>
        <p className="text-sm text-destructive/90 mt-1">{message}</p>
      </div>
    </div>
  );
}
