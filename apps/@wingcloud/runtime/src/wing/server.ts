import { appendFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { createConsoleApp } from "@wingconsole/app";
import { type Application } from "express";

import { type KeyStore } from "../auth/key-store.js";

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
      app.get("/health", async (req, res) => {
        res.sendStatus(200);
      });
    },
  });

  await waitForConsole(port);

  console.log(`Console app opened on port ${port} for app ${entryfilePath}`);
  return { port, close };
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
