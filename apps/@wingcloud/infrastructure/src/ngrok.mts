import child_process from "node:child_process";
import fetch from "node-fetch";
import { appendFileSync } from "node:fs";

export interface NgrokResult {
  pid?: number;
  publicUrl?: string;
}

export const shell = async function (
  command: string,
  args: string[],
): Promise<number | undefined> {
  let pid = undefined;
  return new Promise((resolve, reject) => {
    console.log("execFile", command, args);
    let process = child_process.execFile(command, args);
    resolve(process.pid);
  });
};

export const startNgrok = async (
  port: string,
  domain?: string,
): Promise<NgrokResult> => {
  let options = ["http", port];
  if (domain) {
    options.push(`--domain=${domain}`);
  }
  const pid = await shell("ngrok", options);

  let publicUrl;
  let ngrokPort = 4040;
  while (true) {
    let err: any;
    try {
      const url = await tryPort(port, ngrokPort++);
      if (url) {
        publicUrl = url;
        break;
      }
    } catch (err: any) {
      err = err;
    } finally {
      await sleep(250);
      if (ngrokPort >= 4140) {
        throw new Error(`max ngrok ports reached`);
      }
    }
  }

  return { pid, publicUrl };
};

export const killNgrok = async (pid: number) => {
  appendFileSync("/tmp/104", `\nkill ${pid}`)
  process.kill(pid);
};

const tryPort = async (hostPort: string, ngrokPort: number) => {
  let i = 0;
  while (true) {
    let err: any;
    try {
      appendFileSync("/tmp/104", `\n${i}: ${ngrokPort} ${hostPort}`)
      const data = await fetch(`http://127.0.0.1:${ngrokPort}/api/tunnels`);
      const json: any = await data.json();
      const tunnel = json.tunnels.find(
        (t: any) => t.config.addr === `http://localhost:${hostPort}`,
      );
      appendFileSync("/tmp/104", `\n${i}: ${JSON.stringify(json)}`)
      if (tunnel) {
        return tunnel?.public_url;
      }
    } catch (err: any) {
      err = err;
    } finally {
      await sleep(250);
      if (i++ > 20) {
        throw new Error(`failed to start ngrok on port ${hostPort}: ${err ? err.message : "timeout"}`);
      }
    }
  }
  
};

const sleep = (ms: number) => {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
};
