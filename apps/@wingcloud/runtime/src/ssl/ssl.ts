import { readFileSync, rmSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const loadCertificate = () => {
  const privateKeyEnv = process.env["SSL_PRIVATE_KEY"];
  if (!privateKeyEnv) {
    throw new Error("load certificate: missing private key");
  }

  const certificateEnv = process.env["SSL_CERTIFICATE"];
  if (!certificateEnv) {
    throw new Error("load certificate: missing certificate");
  }

  const key = Buffer.from(privateKeyEnv, "base64").toString("utf8");
  const cert = Buffer.from(certificateEnv, "base64").toString("utf8");
  const options = {
    key,
    cert,
  };

  return options;
};
