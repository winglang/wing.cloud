import { spawn } from "node:child_process";

import react from "@vitejs/plugin-react-swc";
import wingcloud from "@wingcloud/vite";
import getPort from "get-port";
import { Plugin, defineConfig } from "vite";

const api = (): Plugin => {
  let port: number | undefined;
  let process: ReturnType<typeof spawn> | undefined;
  return {
    name: "api",
    async configureServer(context) {
      process?.kill();

      port = await getPort();
      context.config.server.proxy = {
        ...context.config.server.proxy,
        "/trpc": {
          target: `http://localhost:${port}`,
          changeOrigin: true,
        },
      };
    },
    async buildStart() {
      this.debug("buildStart");
      process = spawn(
        "pnpm",
        ["tsx", "watch", "scripts/start-api-dev-server.ts", `--port=${port}`],
        {
          detached: true,
        },
      );

      process.on("message", (data) => {
        this.info(data.toString());
      });

      process.on("error", (error) => {
        this.error(error);
      });

      // `tsx` needs some time to parse and execute the server file.
      let attempts = 0;
      while (attempts++ < 10) {
        try {
          const response = await fetch(`http://localhost:${port}/`);
          console.log(response);
          if (response.ok) {
            break;
          }
        } catch {}
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      }
    },
    closeBundle() {
      process?.kill();
    },
  };
};

export default defineConfig({
  plugins: [api(), react(), wingcloud()],
});
