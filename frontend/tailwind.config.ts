import type { Config } from "tailwindcss";

const config: Config = {
  // Support both .dark and .light class on <html>
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS-variable-driven semantic tokens
        surface: "hsl(var(--bg-surface) / <alpha-value>)",
        elevated: "hsl(var(--bg-elevated) / <alpha-value>)",
        hover: "hsl(var(--bg-hover) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        "border-subtle": "hsl(var(--border-subtle) / <alpha-value>)",

        primary: {
          DEFAULT: "hsl(var(--text-primary) / <alpha-value>)",
          secondary: "hsl(var(--text-secondary) / <alpha-value>)",
          muted: "hsl(var(--text-muted) / <alpha-value>)",
        },

        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          hover: "hsl(var(--accent-hover) / <alpha-value>)",
          muted: "hsl(var(--accent-muted))",
          fg: "hsl(var(--accent-fg) / <alpha-value>)",
        },

        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          muted: "hsl(var(--success-muted))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          muted: "hsl(var(--warning-muted))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger) / <alpha-value>)",
          muted: "hsl(var(--danger-muted))",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          muted: "hsl(var(--info-muted))",
        },

        // Legacy navy palette (kept for backward compat)
        navy: {
          950: "#050a14",
          900: "#0a0f1e",
          800: "#0d1526",
          700: "#111d30",
          600: "#1a2744",
        },
        brand: {
          DEFAULT: "#7c6ff7",
          500: "#7c6ff7",
          600: "#6356e8",
        },
      },

      backgroundColor: {
        base: "hsl(var(--bg-base) / <alpha-value>)",
        surface: "hsl(var(--bg-surface) / <alpha-value>)",
        elevated: "hsl(var(--bg-elevated) / <alpha-value>)",
        hover: "hsl(var(--bg-hover) / <alpha-value>)",
      },

      borderColor: {
        DEFAULT: "hsl(var(--border))",
        subtle: "hsl(var(--border-subtle))",
      },

      textColor: {
        primary: "hsl(var(--text-primary))",
        secondary: "hsl(var(--text-secondary))",
        muted: "hsl(var(--text-muted))",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },

      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "calc(var(--radius) - 4px)",
        lg: "calc(var(--radius) + 4px)",
        xl: "calc(var(--radius) + 8px)",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        accent: "0 0 20px hsl(var(--accent) / 0.25)",
        "accent-lg": "0 0 32px hsl(var(--accent) / 0.35)",
      },

      animation: {
        "fade-in": "fade-in 0.35s ease forwards",
        "slide-up": "slide-up 0.4s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        "pulse-ring": "pulse-ring 2s ease infinite",
        "spin-slow": "spin 3s linear infinite",
      },

      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--success) / 0.4)" },
          "70%": { boxShadow: "0 0 0 8px hsl(var(--success) / 0)" },
          "100%": { boxShadow: "0 0 0 0 hsl(var(--success) / 0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
