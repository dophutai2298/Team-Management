import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
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
        panel: "0 12px 36px hsl(var(--shadow) / 0.08)",
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#087f5b",
              foreground: "#ffffff",
            },
            focus: "#087f5b",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#45c99a",
              foreground: "#071b15",
            },
            focus: "#45c99a",
          },
        },
      },
    }),
  ],
};

export default config;
