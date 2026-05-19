import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Finvora brand palette
        navy: {
          950: "#050a14",
          900: "#0a0f1e",
          800: "#0d1526",
          700: "#111d30",
          600: "#1a2744",
        },
        brand: {
          DEFAULT: "#6366f1",
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        success: {
          DEFAULT: "#10b981",
          light: "#d1fae5",
        },
        danger: {
          DEFAULT: "#f43f5e",
          light: "#ffe4e6",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        "gradient-dark": "linear-gradient(180deg, #0a0f1e 0%, #050a14 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cal Sans", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
