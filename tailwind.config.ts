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
              DEFAULT: "#0F5C45",
              foreground: "#ffffff",
            },
            focus: "#0F5C45",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#77D6AD",
              foreground: "#101513",
            },
            focus: "#77D6AD",
          },
        },
      },
    }),
  ],
};

export default config;
