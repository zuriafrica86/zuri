import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivoire: "#F7F0E6",
        cacao: "#2A1A12",
        or: "#E2B0A0",
        "or-clair": "#EDCBC0",
        rose: "#F3DAD0", // rose pastel discret
        sable: "#E8DCC8", // bordures douces
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(42,26,18,0.04), 0 8px 24px rgba(42,26,18,0.06)",
      },
      borderRadius: {
        lg: "10px",
        xl2: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
