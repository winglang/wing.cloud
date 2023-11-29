import * as crypto from "node:crypto";

export const encrypt = (text: string, key: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decrypt = (text: string, key: string) => {
  const iv = Buffer.from(text.slice(0, 32), "hex");
  const encryptedText = Buffer.from(text.slice(33), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// const encrypted = encrypt(
//   "test",
//   "cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2",
// );
// console.log(encrypted);
// const decrypted = decrypt(
//   encrypted,
//   "cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2",
// );
