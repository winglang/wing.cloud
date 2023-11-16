import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
 
interface EncryptedData {
  iv: string;
  text: string;
}

export const encrypt = (key: string, text: string): EncryptedData => {
  const digestKey = createHash('sha256').update(key).digest('base64').substring(0, 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(digestKey), iv);
 
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return { iv: iv.toString("base64"), text: encrypted.toString('base64') };
};

export const decrypt = (key: string, encrypted: EncryptedData) => {
  const digestKey = createHash('sha256').update(key).digest('base64').substring(0, 32);
  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(digestKey), Buffer.from(encrypted.iv, "base64"));
  let decrypted = '';

  decipher.on('readable', () => {
    let chunk;
    while (null !== (chunk = decipher.read())) {
      decrypted += chunk.toString('utf8');
    }
  });
  
  decipher.write(encrypted.text, 'base64');
  decipher.end();

  return decrypted
};
