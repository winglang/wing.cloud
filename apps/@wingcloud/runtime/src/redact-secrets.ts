import * as redactEnv from "redact-env";

export const redactSecrets = (secrets: string[]) => {
  const obj: Record<string, string> = {};
  for (const [index, secret] of secrets.entries()) {
    obj[`secret_${index}`] = secret;
  }

  const redactPattern = redactEnv.build(Object.keys(obj), obj);
  return (message: string) => {
    return redactEnv.redact(message, redactPattern, "***");
  };
};
