import { appendFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { createConsoleApp } from "@wingconsole/app";
import { type Application } from "express";

import { type KeyStore } from "../auth/key-store.js";

export interface StartServerProps {
  consolePath: string;
  entryfilePath: string;
  logfile: string;
  keyStore: KeyStore;
  requestedPort?: number;
}

export async function startServer({
  consolePath,
  entryfilePath,
  logfile,
  keyStore,
  requestedPort,
}: StartServerProps) {
  const wingConsole = await import(consolePath);
  const create: typeof createConsoleApp = wingConsole.createConsoleApp;
  const writeMessageToFile = (message: any, ...props: any) => {
    appendFileSync(
      logfile,
      `${message}${props.length > 0 ? ":" + props.join(",") : ""}\n`,
      "utf8",
    );
  };
  const { port, close } = await create({
    wingfile: entryfilePath,
    requestedPort,
    log: {
      info: writeMessageToFile,
      error: writeMessageToFile,
      verbose: writeMessageToFile,
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
      app.get("/logs", async (req, res) => {
        const data = await readFile(logfile, "utf8");
        res.send(data);
      });
    },
  });
  console.log(`Console app opened on port ${port} for app ${entryfilePath}`);
  return { port, close };
}
