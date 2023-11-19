import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/apps",
  build: {
    outDir: "./dist/apps",
  },
  server: {
    hmr: {
      port: 5177,
    },
  },
});
