import ui from "@wingconsole/ui/tailwind-plugin.cjs";
import { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: [...ui.content, "index.html", "src/**/*"],
  darkMode: "class",
  plugins: [...ui.plugins],
  theme: {
    ...ui.theme,
    fontFamily: {
      ...defaultTheme.fontFamily,
      sans: ["IBM Plex Sans Var", ...defaultTheme.fontFamily.sans],
      mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
    },
  },
} satisfies Config;
