import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#05070c",
        panel: "#0b1220",
        steel: "#182033",
        cyanline: "#2dd4bf",
        signal: "#7dd3fc",
      },
      boxShadow: {
        terminal: "0 0 24px rgba(45, 212, 191, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
