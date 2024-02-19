import react from "@vitejs/plugin-react-swc";
import getPort from "get-port";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      port: await getPort(),
    },
  },
});
