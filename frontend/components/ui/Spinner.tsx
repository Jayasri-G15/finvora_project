type SpinnerSize = "sm" | "md" | "lg";

const sizeMap: Record<SpinnerSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-7 h-7 border-2",
  lg: "w-10 h-10 border-[3px]",
};

export function Spinner({ size = "md", className = "" }: { size?: SpinnerSize; className?: string }) {
  return (
    <div
      className={`
        ${sizeMap[size]}
        rounded-full
        border-[hsl(var(--border))]
        border-t-[hsl(var(--accent))]
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Spinner size="lg" />
    </div>
  );
}
