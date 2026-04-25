import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        cairo: ["var(--font-cairo)", "sans-serif"],
        tajawal: ["var(--font-tajawal)", "sans-serif"],
        amiri: ["var(--font-amiri)", "serif"],
      },
      colors: {
        gold: {
          50: "#fbf7ec",
          100: "#f5ebcb",
          200: "#ecd391",
          300: "#e2b95a",
          400: "#d8a437",
          500: "#c08823",
          600: "#a26b1c",
          700: "#834f1a",
          800: "#6c3f1a",
          900: "#5b341a",
        },
        cream: {
          50: "#fcfaf5",
          100: "#f8f3e6",
          200: "#f1e7cf",
        },
        ink: {
          900: "#1a1410",
          800: "#2b211a",
          700: "#3e2f24",
          600: "#5c4838",
          500: "#7a604a",
        },
      },
      typography: ({ theme }: any) => ({
        DEFAULT: {
          css: {
            color: theme("colors.ink.800"),
            a: { color: theme("colors.gold.700") },
            'h1,h2,h3,h4': { color: theme("colors.ink.900"), fontFamily: theme("fontFamily.cairo").join(",") },
          },
        },
      }),
    },
  },
  plugins: [],
};
export default config;
