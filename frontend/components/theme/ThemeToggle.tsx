"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const initial = saved === "light" ? "light" : "dark";
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
  }

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-lg ${className}`} />
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`
        w-8 h-8 rounded-lg flex items-center justify-center
        text-primary/secondary hover:text-primary
        bg-transparent hover:bg-hover
        transition-colors duration-150
        ${className}
      `}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]" />
      ) : (
        <Moon className="w-4 h-4 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]" />
      )}
    </button>
  );
}
