import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F0",
        "cream-dark": "#F3EFE4",
        charcoal: "#1A1A18",
        "charcoal-light": "#2D2D2A",
        forest: {
          DEFAULT: "#1B3A2D",
          light: "#234D3A",
          dark: "#13291E",
          50: "#F0F5F2"
        },
        rust: {
          DEFAULT: "#B4552F",
          light: "#C96B44",
          dark: "#8F4225"
        },
        sand: {
          DEFAULT: "#AD8C56",
          light: "#C9A86E",
          dark: "#8A6E3F",
          50: "#FDF9F0"
        },
        navy: "#1B2A4A",
        olive: "#5C5A2E",
        maroon: "#5C1F2E"
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      fontSize: {
        "display-2xl": ["4.5rem", { lineHeight: "1.0", letterSpacing: "-0.02em", fontWeight: "500" }],
        "display-xl": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.015em", fontWeight: "500" }],
        "display-lg": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "500" }],
        "display-md": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.005em", fontWeight: "500" }],
        "display-sm": ["1.25rem", { lineHeight: "1.3", letterSpacing: "0", fontWeight: "500" }],
        caption: ["0.7rem", { lineHeight: "1.4", letterSpacing: "0.1em", fontWeight: "500" }],
        overline: ["0.65rem", { lineHeight: "1.4", letterSpacing: "0.14em", fontWeight: "600" }]
      },
      borderRadius: {
        card: "12px",
        field: "8px"
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem"
      },
      keyframes: {
        gradientMove: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        gradientMove: "gradientMove 8s ease infinite",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-up": "slide-up 0.6s ease-out forwards",
        shimmer: "shimmer 2s infinite linear"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
