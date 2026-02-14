import * as React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fdprocessedid?: string;
}

function Input({ className, type, ...props }: InputProps) {
  // Filter out client-side only attributes that might cause hydration mismatches
  const filteredProps = { ...props };
  if (typeof window === 'undefined') {
    // Remove any client-side only attributes during SSR
    delete filteredProps.fdprocessedid;
  }

  return (
    <input
      type={type}
      data-slot="input"
      suppressHydrationWarning={true}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...filteredProps}
    />
  )
}

export { Input }
