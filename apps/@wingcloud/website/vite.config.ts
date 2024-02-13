import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

import { api } from "./plugins/index.js";

export default defineConfig({
  plugins: [api(), react()],
  server: {
    hmr: {
      port: 5800,
    },
  },
});
