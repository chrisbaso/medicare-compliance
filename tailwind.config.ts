import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#fcfaf5",
          100: "#f5f0e7",
          200: "#ebe2d2",
          300: "#d7cab2"
        },
        ink: {
          950: "#15201f"
        },
        teal: {
          50: "#ebfffc",
          100: "#c9faf2",
          500: "#1d8c82",
          700: "#0f6e68"
        }
      },
      fontFamily: {
        sans: ["Arial", "Helvetica Neue", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
        mono: ["Consolas", "Courier New", "monospace"]
      },
      boxShadow: {
        panel: "0 18px 40px rgba(21, 32, 31, 0.06)"
      },
      borderRadius: {
        panel: "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
