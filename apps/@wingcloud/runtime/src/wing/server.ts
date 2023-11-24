import { createConsoleApp } from "@wingconsole/app";
import { type Application } from "express";

import { type KeyStore } from "../auth/key-store.js";
import type { LoggerInterface } from "../logger.js";

export interface StartServerProps {
  consolePath: string;
  entryfilePath: string;
  logger: LoggerInterface;
  keyStore: KeyStore;
  requestedPort?: number;
}

export async function startServer({
  consolePath,
  entryfilePath,
  logger,
  keyStore,
  requestedPort,
}: StartServerProps) {
  const wingConsole = await import(consolePath);
  const create: typeof createConsoleApp = wingConsole.createConsoleApp;

  const log = (message: string, props?: any[]) => {
    logger.log(message, props);
  };

  const { port, close } = await create({
    wingfile: entryfilePath,
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
  console.log(`Console app opened on port ${port} for app ${entryfilePath}`);
  return { port, close };
}
