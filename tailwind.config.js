/** @type {import('tailwindcss').Config} */
// AskBobAI design tokens — sourced from the AskBobAI Brand Guide (Edition 01, 2026).
// Themeable colors are driven by CSS variables (see index.css :root / .dark) so
// existing utility classes flip in dark mode automatically. `white` stays fixed
// (used for text-on-color and the dark sidebar's white-alpha overlays).
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "#ffffff", // fixed — text on color + sidebar overlays
        // AskBob Blue family (primary surface, the brand mood).
        brand: {
          DEFAULT: "#1281DE",
          bright: "#0AC6FF",
          deep: "#003CAB",
          tint: rgb("--c-brand-tint"),
          wash: "#E8F0FF",
        },
        // AskBob Green family — ACTION / CTA only.
        green: {
          DEFAULT: "#19D467",
          deep: "#0E9C4A",
          mint: "#99F0BD",
          tint: rgb("--c-green-tint"),
        },
        // Brand error.
        danger: {
          DEFAULT: "#A92922",
          tint: rgb("--c-danger-tint"),
        },
        // Headings / strong text. Flips light in dark mode. (900 stays fixed for
        // dark text on the green CTA.)
        navy: {
          DEFAULT: rgb("--c-navy"),
          900: "#0A0A0A",
          800: "#1F232B",
          700: "#2A2F3A",
        },
        // Card + page surfaces.
        surface: {
          DEFAULT: rgb("--c-surface"),
          dark: "#151922", // fixed dark surface (sidebar, tiles)
        },
        page: rgb("--c-bg"),
        // Confidence scale — used ONLY for confidence indicators.
        conf: {
          high: "#19D467",
          med: "#F5A623",
          low: "#E5484D",
        },
        // Neutral working ramp (themeable).
        ink: {
          50: rgb("--c-ink-50"),
          100: rgb("--c-ink-100"),
          200: rgb("--c-ink-200"),
          300: rgb("--c-ink-300"),
          400: rgb("--c-ink-400"),
          500: rgb("--c-ink-500"),
          600: rgb("--c-ink-600"),
          700: rgb("--c-ink-700"),
          800: rgb("--c-ink-800"),
          900: rgb("--c-ink-900"),
        },
      },
      fontFamily: {
        display: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "Consolas", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(10, 10, 10, 0.04), 0 1px 3px rgba(10, 10, 10, 0.06)",
        float: "0 18px 40px -16px rgba(10, 10, 10, 0.28)",
        lift: "0 10px 30px -14px rgba(18, 129, 222, 0.45)",
        cta: "0 8px 18px -8px rgba(25, 212, 103, 0.55)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #003CAB 0%, #1281DE 52%, #0AC6FF 100%)",
        "sky-wash": "linear-gradient(180deg, #1281DE 0%, #4AA6EA 55%, #EDF7FF 100%)",
        "cta-gradient": "linear-gradient(135deg, #19D467 0%, #0E9C4A 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
        "scale-in": "scale-in 0.18s ease-out both",
        "slide-in": "slide-in 0.28s cubic-bezier(0.16,1,0.3,1) both",
        "spin-slow": "spin-slow 1.1s linear infinite",
      },
    },
  },
  plugins: [],
};
