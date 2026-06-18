/** @type {import('tailwindcss').Config} */
// AskBobAI design tokens — sourced from the AskBobAI Brand Guide (Edition 01, 2026).
// Ratio intent: "AskBob Blue carries the mood, Ink carries the message, and
// AskBob Green marks the moment of action." Green is reserved for CTAs only.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // AskBob Blue family (primary surface, the brand mood).
        brand: {
          DEFAULT: "#1281DE", // AskBob Blue
          bright: "#0AC6FF", // Signal Cyan — highlight
          deep: "#003CAB", // Deep Blue — overlay / depth
          tint: "#EDF7FF", // Sky Wash — card background
          wash: "#E8F0FF",
        },
        // AskBob Green family — ACTION / CTA only.
        green: {
          DEFAULT: "#19D467",
          deep: "#0E9C4A",
          mint: "#99F0BD", // Fresh Mint — editorial accent
          tint: "#F2FAF5",
        },
        // Brand error.
        danger: {
          DEFAULT: "#A92922",
          tint: "#FFF3F2",
        },
        // Dark surfaces (sidebar, tiles, footer, hero base).
        navy: {
          DEFAULT: "#151922", // Night Ink
          900: "#0A0A0A", // Ink
          800: "#1F232B",
          700: "#2A2F3A",
        },
        // Confidence scale — used ONLY for confidence indicators. Pulled toward
        // the brand: high = AskBob Green, low = brand red, amber for medium.
        conf: {
          high: "#19D467",
          med: "#F5A623",
          low: "#E5484D",
        },
        // Neutral working ramp (brand neutrals: Paper, Mist, Muted UI, Ink).
        ink: {
          50: "#FAFBFC", // Paper / soft panels
          100: "#F2F4F7",
          200: "#E6E8EC", // hairline borders
          300: "#D5D8DE",
          400: "#B5B8BF", // Muted UI
          500: "#8A8D94",
          600: "#6A6A6A", // Secondary text
          700: "#3A3D44",
          800: "#1F232B",
          900: "#0A0A0A", // Ink / body
        },
      },
      fontFamily: {
        // Figtree carries the whole system (display + body).
        display: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Italic serif accent for a single stepped-out word.
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        // Data & metadata: Consolas, or JetBrains Mono on screen.
        mono: ['"JetBrains Mono"', 'Consolas', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: "0 1px 2px rgba(10, 10, 10, 0.04), 0 1px 3px rgba(10, 10, 10, 0.06)",
        float: "0 18px 40px -16px rgba(10, 10, 10, 0.28)",
        // Soft blue lift for white cards sitting on blue.
        lift: "0 10px 30px -14px rgba(18, 129, 222, 0.45)",
        cta: "0 8px 18px -8px rgba(25, 212, 103, 0.55)",
      },
      backgroundImage: {
        // The signature AskBob sky gradient (hero surfaces, dark-on-blue cards).
        "brand-gradient": "linear-gradient(135deg, #003CAB 0%, #1281DE 52%, #0AC6FF 100%)",
        // Soft top-down sky wash for page bands.
        "sky-wash": "linear-gradient(180deg, #1281DE 0%, #4AA6EA 55%, #EDF7FF 100%)",
        // Green CTA.
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
