import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerClassName = "",
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[hsl(var(--text-secondary))]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              input-field
              ${leftIcon ? "pl-9" : ""}
              ${rightIcon ? "pr-9" : ""}
              ${error ? "border-[hsl(var(--danger))] focus:border-[hsl(var(--danger))] focus:shadow-[0_0_0_3px_hsl(var(--danger)/0.15)]" : ""}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-[hsl(var(--danger))]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[hsl(var(--text-muted))]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
