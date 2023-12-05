import https from "node:https";

import { createConsoleApp } from "@wingconsole/app";
import express, { type Application } from "express";
import httpProxy from "http-proxy";

import { type KeyStore } from "../auth/key-store.js";
import type { LoggerInterface } from "../logger/logger.js";
import { loadCertificate } from "../ssl/ssl.js";

import { findEndpoints } from "./endpoints.js";

interface ConsoleState {
  result: {
    data: "success" | "error";
  };
}

interface ConsoleError {
  result: {
    data: string | undefined;
  };
}

export interface PrepareServerProps {
  environmentId: string;
  requestedSSLPort?: number;
}

export interface StartServerProps {
  consolePath: string;
  entrypointPath: string;
  logger: LoggerInterface;
  keyStore: KeyStore;
  requestedPort?: number;
}

export async function prepareServer({
  environmentId,
  requestedSSLPort,
}: PrepareServerProps) {
  let consolePort: number | undefined;
  const app = express();
  const proxy = httpProxy.createProxyServer({ changeOrigin: true });
  proxy.on("error", (error: any) => {
    console.error("proxy error", error);
  });

  const endpointsFn = findEndpoints();

  const proxyToPort = async (host: string, consolePort: number) => {
    const { endpointsByDigest, endpointsByPort } = await endpointsFn({
      port: consolePort,
      environmentId,
    });

    // check of its a request for a local port by its digest value
    const domainParts = host.split(".");
    const digest = domainParts[0]!;
    const endpoint = endpointsByDigest[digest];
    if (endpoint !== undefined) {
      return endpoint.url;
    }

    // check of its a request for a local port by its port value
    const parts = host.split(":");
    if (parts.length > 1) {
      const targetPort = Number.parseInt(parts[1]!, 10);

      const endpoint = endpointsByPort[targetPort];
      if (endpoint !== undefined) {
        return endpoint.url;
      }
    }

    return;
  };

  app.use(async (req, res, next) => {
    if (!consolePort) {
      return next();
    }

    const host = req.headers.host;
    if (!host) {
      return next();
    }

    // request intended for the console (fly.io)
    if (host.endsWith("fly.dev")) {
      return next();
    }

    const proxyUrl = await proxyToPort(host, consolePort);
    if (proxyUrl) {
      proxy.web(req, res, {
        target: proxyUrl,
      });
    } else {
      next();
    }
  });

  const sslServer = https.createServer(loadCertificate(), app);

  sslServer.on("upgrade", async (req, socket, head) => {
    if (!consolePort) {
      console.error("console port not found");
      return;
    }

    const host = req.headers.host;
    if (!host) {
      console.error("host header not found");
      return;
    }

    const proxyUrl = await proxyToPort(host, consolePort);
    if (proxyUrl) {
      proxy.ws(req, socket, head, {
        target: proxyUrl,
      });
    }
  });

  const sslPort = requestedSSLPort || Math.floor(Math.random() * 1000 + 3000);
  sslServer.listen(sslPort, () => {
    console.log(`SSL server is listening on port ${sslPort}`);
  });

  return {
    closeSSL: () => {
      sslServer.close();
    },
    startServer: async ({
      consolePath,
      entrypointPath,
      logger,
      keyStore,
      requestedPort,
    }: StartServerProps) => {
      const wingConsole = await import(consolePath);
      const create: typeof createConsoleApp = wingConsole.createConsoleApp;
      const log = (message: string, props?: any[]) => {
        logger.log(message, props);
      };

      const { port, close } = await create({
        wingfile: entrypointPath,
        expressApp: app,
        requestedPort,
        log: {
          info: log,
          error: log,
          verbose: log,
        },
        config: {
          addEventListener(event: any, listener: any) {},
          removeEventListener(event: any, listener: any) {},
          get(key: any) {
            return key;
          },
          set(key: any, value: any) {},
        },
        onExpressCreated: (app: Application) => {
          app.get("/public-key", async (req, res) => {
            const data = keyStore.publicKey();
            res.send(data);
          });
          app.get("/health", async (req, res) => {
            res.sendStatus(200);
          });
        },
      });

      await waitForConsole(port);

      const { endpoints } = await endpointsFn({ port, environmentId });
      console.log(
        `Console app opened on port ${port} for app ${entrypointPath}`,
        JSON.stringify({
          endpoints,
        }),
      );
      consolePort = port;
      return { port, close, endpoints };
    },
  };
}

const waitForConsole = async (port: number) => {
  for (let i = 0; i < 600 * 60; i++) {
    const res = await fetch(`http://localhost:${port}/trpc/app.state`);
    if (!res.ok) {
      throw new Error(`failed to fetch console state: ${await res.text()}`);
    }

    const state: ConsoleState = (await res.json()) as any;
    if (state.result.data == "success") {
      return;
    } else if (state.result.data == "error") {
      const res = await fetch(`http://localhost:${port}/trpc/app.error`);
      if (!res.ok) {
        throw new Error(`failed to fetch app error: ${await res.text()}`);
      }
      const error: ConsoleError = (await res.json()) as any;
      throw new Error(`app error: ${error.result.data}`);
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  throw new Error(`app error: timeout`);
};
