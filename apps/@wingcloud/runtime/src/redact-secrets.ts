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
    const secretsFile = join(homedir(), ".wing", "secrets.json");
    if (existsSync(secretsFile)) {
      const secretsJson = readFileSync(secretsFile, "utf8");
      const secretsMap: Record<string, string> = JSON.parse(secretsJson);
      return Object.values(secretsMap);
    } else {
      return [];
    }
  } catch (error: any) {
    console.log(`failed to collect secrets: ${error.toString()}`);
    throw error;
  }
};
