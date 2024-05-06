import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import * as redactEnv from "redact-env";

export const redactSecrets = () => {
  const secrets = [...collectEnvSecrets(), ...collectWingSecrets()];
  const obj: Record<string, string> = {};
  for (const [index, secret] of secrets.entries()) {
    obj[`secret_${index}`] = secret;
  }

  const redactPattern = redactEnv.build(Object.keys(obj), obj);
  return (message: string) => {
    return redactEnv.redact(message, redactPattern, "***");
  };
};

const collectEnvSecrets = (): string[] => {
  const secrets = [];
  const envVars = ["GIT_TOKEN"];
  for (let envVar of envVars) {
    const envVarSecret = process.env[envVar];
    if (envVarSecret) {
      secrets.push(envVarSecret);
    }
  }

  return secrets;
};

const collectWingSecrets = (): string[] => {
  try {
    const secretsFile = join("/app", ".env");
    if (existsSync(secretsFile)) {
      const secretsEnv = readFileSync(secretsFile, "utf8");
      const secretsMap = Object.fromEntries(
        secretsEnv
          .split("\n")
          .filter((line) => line.includes("="))
          .map((line) => {
            const [key, ...valueParts] = line.trim().split("=");
            return [key, valueParts.join("=")];
          }),
      );
      return Object.values(secretsMap);
    } else {
      return [];
    }
  } catch (error: any) {
    console.log(`failed to collect secrets: ${error.toString()}`);
    throw error;
  }
};
