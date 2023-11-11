import child_process from "node:child_process";
import fetch from "node-fetch";

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

  let i = 0;
  let publicUrl;
  while (true) {
    try {
      const data = await fetch("http://127.0.0.1:4040/api/tunnels");
      const json: any = await data.json();
      const tunnel = json.tunnels.find(
        (t: any) => t.config.addr === `http://localhost:${port}`,
      );
      publicUrl = tunnel.public_url;
      break;
    } catch {
      if (i++ > 20) {
        throw new Error("failed to start ngrok");
      }
      await sleep(250);
    }
  }

  return { pid, publicUrl };
};

export const killNgrok = async (pid: number) => {
  process.kill(pid);
};

const sleep = (ms: number) => {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
};
