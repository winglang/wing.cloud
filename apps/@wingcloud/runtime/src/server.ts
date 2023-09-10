import { Application } from "express";
import { createConsoleApp } from "@wingconsole/app";
import { readFile } from "fs/promises";
import { appendFileSync } from "fs";
import { KeyStore } from "./auth/key-store";

export interface StartServerProps {
  consolePath: string;
  entryfilePath: string;
  logfile: string;
  keyStore: KeyStore;
}

export async function startServer({ consolePath, entryfilePath, logfile, keyStore }: StartServerProps) {
  const wingConsole = require(consolePath);
  const create: typeof createConsoleApp = wingConsole.createConsoleApp;
  const writeMessageToFile = (message: any, ...props: any) => {
    appendFileSync(logfile, `${message}${props.length ? ":" + props.join(",") : "" }\n`, "utf-8");
  };
  const { port, close } = await create({
    wingfile: entryfilePath,
    requestedPort: 3000,
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
        const data = await readFile(logfile, "utf-8");
        res.send(data);
      });
    }
  });
  console.log(`Console app opened on port ${port} for app ${entryfilePath}`);
  return { port, close };
}
