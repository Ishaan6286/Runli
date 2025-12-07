// tailwind.config.cjs
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7c3aed", // Violet 600
          hover: "#6d28d9", // Violet 700
          light: "#8b5cf6", // Violet 500
        },
        secondary: {
          DEFAULT: "#db2777", // Pink 600
          hover: "#be185d", // Pink 700
        },
        accent: {
          DEFAULT: "#06b6d4", // Cyan 500
          hover: "#0891b2", // Cyan 600
        },
        dark: {
          DEFAULT: "#030712", // Gray 950 (Main bg)
          surface: "#111827", // Gray 900 (Cards/Surfaces)
          lighter: "#1f2937", // Gray 800
        },
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)",
        glow: "0 0 20px rgba(124, 58, 237, 0.5)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
