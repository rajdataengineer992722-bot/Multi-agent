import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07111f",
        panel: "#0d1a2b",
        panelSoft: "#12233a",
        line: "rgba(171, 195, 255, 0.16)",
        accent: "#7df9c6",
        accentWarm: "#ffb86b",
        accentCold: "#7cc8ff",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(125, 249, 198, 0.10), 0 20px 60px rgba(4, 12, 24, 0.55)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(124, 200, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 200, 255, 0.08) 1px, transparent 1px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
