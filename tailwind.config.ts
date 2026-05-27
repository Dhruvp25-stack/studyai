import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0A0A0F",
          50: "#F0F0FF",
          100: "#E0E0FF",
          200: "#C0C0F0",
          300: "#9090D0",
          400: "#6060B0",
          500: "#3030A0",
          600: "#202080",
          700: "#181860",
          800: "#101040",
          900: "#080820",
        },
        neon: {
          green: "#00FF88",
          blue: "#0088FF",
          purple: "#8800FF",
          pink: "#FF0088",
          yellow: "#FFEE00",
        },
        surface: {
          DEFAULT: "#0F0F1A",
          elevated: "#16162A",
          border: "#252540",
        },
      },
      backgroundImage: {
        "grid-pattern": "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      backgroundSize: {
        "grid": "32px 32px",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "shimmer": "shimmer 2s infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(0,255,136,0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(0,255,136,0.6)" },
        },
      },
      boxShadow: {
        "neon-green": "0 0 20px rgba(0,255,136,0.4)",
        "neon-blue": "0 0 20px rgba(0,136,255,0.4)",
        "neon-purple": "0 0 20px rgba(136,0,255,0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
