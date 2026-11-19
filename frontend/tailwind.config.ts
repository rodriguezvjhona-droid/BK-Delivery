import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bk: {
          bg: "#0c0d0e",
          card: "#141619",
          hover: "#1c1f24",
          border: "#282c34",
          red: {
            DEFAULT: "#dc2626",
            dark: "#991b1b",
            light: "#ef4444",
          },
          gold: {
            DEFAULT: "#f59e0b",
            dark: "#b45309",
            light: "#fbbf24",
          },
          muted: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};
export default config;
