/** @type {import('tailwindcss').Config} */
// AskBobAI design tokens. The brand colors are deliberately scoped:
// - brand blue + gradient => primary actions only
// - green => confirmation / high confidence
// - navy => sidebar, dark surfaces, headings
// - confidence scale => used ONLY for confidence indicators
// Everything else leans on the neutral `ink` gray ramp so the brand earns attention.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1181DE",
          bright: "#1F9AFF",
          tint: "#EDF7FF",
        },
        green: {
          DEFAULT: "#0DC159",
          deep: "#008035",
          tint: "#DBFFEA",
        },
        navy: {
          DEFAULT: "#001E2B",
          700: "#0A2A38",
          600: "#13384A",
          500: "#1E4A5E",
        },
        // Confidence scale — reserved for confidence indicators only.
        conf: {
          high: "#0DC159",
          med: "#F5A623",
          low: "#E5484D",
        },
        // Neutral working ramp.
        ink: {
          50: "#F7F9FB",
          100: "#EEF2F6",
          200: "#E0E7EE",
          300: "#CBD5DF",
          400: "#94A6B5",
          500: "#647888",
          600: "#475866",
          700: "#33414C",
          800: "#1F2A33",
          900: "#0F1820",
        },
      },
      fontFamily: {
        display: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Fragment Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 24, 32, 0.04), 0 1px 3px rgba(15, 24, 32, 0.06)",
        float: "0 10px 30px -12px rgba(15, 24, 32, 0.25)",
        brand: "0 8px 20px -8px rgba(17, 129, 222, 0.55)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #1181DE 0%, #1F9AFF 100%)",
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
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
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
