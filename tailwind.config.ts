import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "brand" now maps to Garasiku's blue identity — every existing bg-brand-600 /
        // text-brand-700 usage across the app picks this up automatically.
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284C7",
          700: "#0369a1",
        },
        success: {
          50: "#ecfdf5",
          500: "#10B981",
        },
        alert: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#F97316",
          900: "#7c2d12",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        elevated: "0 20px 25px -5px rgb(15 23 42 / 0.08), 0 8px 10px -6px rgb(15 23 42 / 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
