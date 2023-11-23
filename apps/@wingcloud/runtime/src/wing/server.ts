import { createConsoleApp } from "@wingconsole/app";
import { type Application } from "express";

import { type KeyStore } from "../auth/key-store.js";
import type { Logger } from "../logger.js";

export interface StartServerProps {
  consolePath: string;
  entryfilePath: string;
  logger: Logger;
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
  const { port, close } = await create({
    wingfile: entryfilePath,
    requestedPort,
    log: {
      info: logger.log,
      error: logger.log,
      verbose: logger.log,
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
