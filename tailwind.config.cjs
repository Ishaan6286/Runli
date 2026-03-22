// tailwind.config.cjs — Runli Neo-Glass Elite v2.0
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    "#0A0A0B",
          surface: "#111113",
          raised:  "#16161A",
          overlay: "#1C1C21",
        },
        primary: {
          300: "#86efac",
          400: "#4ade80",
          500: "#22C55E",
          600: "#16a34a",
          700: "#15803d",
        },
        blue: {
          400: "#60a5fa",
          500: "#3B82F6",
          600: "#2563eb",
        },
        purple: {
          400: "#a78bfa",
          500: "#8B5CF6",
          600: "#7c3aed",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        txt: {
          primary:   "#F2F2F3",
          secondary: "#8B8B96",
          muted:     "#56565F",
          inverse:   "#0A0A0B",
        },
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "glow-primary": "0 0 0 1px rgba(34,197,94,0.2), 0 4px 20px rgba(34,197,94,0.12)",
        "glow-blue":    "0 0 0 1px rgba(59,130,246,0.2), 0 4px 20px rgba(59,130,246,0.12)",
        "glow-purple":  "0 0 0 1px rgba(139,92,246,0.2), 0 4px 20px rgba(139,92,246,0.12)",
        "glow-amber":   "0 0 0 1px rgba(245,158,11,0.2),  0 4px 20px rgba(245,158,11,0.12)",
        "card":         "0 4px 16px rgba(0,0,0,0.5)",
        "card-hover":   "0 8px 32px rgba(0,0,0,0.55)",
        "modal":        "0 16px 48px rgba(0,0,0,0.6)",
      },
      transitionTimingFunction: {
        "out-expo":     "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-premium": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "blob-drift-1": "blobDrift1 22s ease-in-out infinite alternate",
        "blob-drift-2": "blobDrift2 28s ease-in-out infinite alternate-reverse",
        "blob-drift-3": "blobDrift3 32s ease-in-out infinite alternate",
        "fade-up":      "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "shimmer":      "shimmer 1.8s ease-in-out infinite",
      },
      keyframes: {
        blobDrift1: {
          from: { transform: "translate(0,0) scale(1)" },
          to:   { transform: "translate(3%,5%) scale(1.05)" },
        },
        blobDrift2: {
          from: { transform: "translate(0,0) scale(1)" },
          to:   { transform: "translate(-4%,-3%) scale(1.04)" },
        },
        blobDrift3: {
          from: { transform: "translate(0,0) scale(1)" },
          to:   { transform: "translate(2%,-4%) scale(1.06)" },
        },
        fadeUp: {
          from: { opacity: 0, transform: "translateY(14px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};
