import react from "@vitejs/plugin-react-swc";
import wingcloud from "@wingcloud/vite";
import { defineConfig } from "vite";

import { api } from "./plugins/index.js";

export default defineConfig({
  plugins: [api(), react(), wingcloud()],
  server: {
    hmr: {
      port: 5800,
    },
  },
});
