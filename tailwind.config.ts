import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        gain: "#16a34a",
        loss: "#dc2626",
      },
    },
  },
  plugins: [],
};

export default config;
