import { execFile } from "node:child_process";

export const exec = async (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return reject(error);
      }

      return resolve(stdout ?? stderr);
    });
  });
};
