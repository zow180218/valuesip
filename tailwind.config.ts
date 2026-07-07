import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#378ADD",  // ValueSip primary
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        hh: {
          DEFAULT: "#F59E0B",  // Happy Hour amber
          light: "#FEF3C7",
          dark: "#D97706",
        },
      },
      boxShadow: {
        "float": "0 4px 24px rgba(0,0,0,0.12)",
        "pin": "0 2px 8px rgba(0,0,0,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
