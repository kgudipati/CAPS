import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        background: '#1A1A1A', // Very dark background
        card: '#2A2A2A',       // Slightly lighter card background
        border: '#404040',     // Subtle border/divider
        'text-primary': '#E5E5E5',   // Main text color (off-white)
        'text-secondary': '#A3A3A3', // Secondary text color (gray)
        accent: '#C89B78',     // Muted gold/bronze accent
        'accent-hover': '#D4AF8A', // Lighter accent for hover
        // Keep indigo for existing badge colors temporarily if needed, or redefine
        // Example: Redefine indigo for badges if desired
        // indigo: {
        //   100: '#...', // Lighter shade for badge bg
        //   300: '#...', // Shade for badge text
        //   400: '#...', // Shade for badge remove icon
        //   500: '#...', // Shade for badge ring
        //   600: '#...', // Main accent color if using indigo
        //   700: '#...', // Hover color if using indigo
        // }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // Optional: Add subtle shadows if desired
      // boxShadow: {
      //   'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      // }
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Form styling plugin
  ],
};
export default config; 