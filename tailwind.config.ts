import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identité de marque — inchangée
        ivoire: "#F7F0E6",
        cacao: "#2A1A12",
        or: "#E2B0A0",
        "or-clair": "#EDCBC0",
        rose: "#F3DAD0", // rose pastel discret
        sable: "#EBD9CF", // bordures douces
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      // Rayons hiérarchisés : petits contrôles < standard (cartes/boutons/champs) < panneaux héros
      borderRadius: {
        lg: "12px",
        xl2: "16px", // standard du système
        "3xl": "22px",
        "4xl": "28px", // médias / panneaux premium
      },
      // Ombres chaudes (teintées cacao), en couches — jamais de noir pur
      boxShadow: {
        soft: "0 1px 2px rgba(42,26,18,0.04), 0 8px 24px rgba(42,26,18,0.06)",
        card: "0 1px 3px rgba(42,26,18,0.05), 0 14px 34px -10px rgba(42,26,18,0.10)",
        pop: "0 10px 44px -10px rgba(42,26,18,0.20)",
        focus: "0 0 0 3px rgba(226,176,160,0.45)",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)", // ease-out premium
      },
      transitionDuration: {
        250: "250ms",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
