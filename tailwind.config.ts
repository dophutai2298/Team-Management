import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "hsl(var(--canvas))",
        panel: "hsl(var(--panel))",
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        line: "hsl(var(--line))",
      },
      boxShadow: {
        panel: "0 4px 20px -2px hsl(var(--shadow) / 0.1)",
        lift: "0 10px 25px -5px hsl(var(--shadow) / 0.15), 0 8px 10px -6px hsl(var(--shadow) / 0.1)",
        button: "0 4px 14px 0 hsl(var(--shadow) / 0.3)",
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#4F46E5",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#7C3AED",
              foreground: "#ffffff",
            },
            focus: "#4F46E5",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#818CF8",
              foreground: "#0B1020",
            },
            secondary: {
              DEFAULT: "#A78BFA",
              foreground: "#0B1020",
            },
            focus: "#818CF8",
          },
        },
      },
    }),
  ],
};

export default config;
