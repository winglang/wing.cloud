import react from "@vitejs/plugin-react-swc";
import getPort from "get-port";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000 + Math.floor(Math.random() * 1000),
    hmr: {
      port: await getPort(),
    },
  },
});
