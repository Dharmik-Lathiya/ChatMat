import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf6",
          100: "#d1fae7",
          200: "#a7f3d3",
          300: "#6ee7bb",
          400: "#34d39e",
          500: "#0cb58b",
          600: "#0a9a75",
          700: "#0b7c60",
          800: "#0d624e",
          900: "#0d5141",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.08)",
        pop: "0 8px 30px rgba(15,23,42,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
