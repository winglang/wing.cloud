import { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["index.html", "src/**/*"],
  darkMode: "class",
  theme: {
    fontFamily: {
      ...defaultTheme.fontFamily,
      sans: ["IBM Plex Sans", "Inter", ...defaultTheme.fontFamily.sans],
      mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
    },
  },
} satisfies Config;
