export default interface extern {
  decrypt: (keyId: string, text: string) => Promise<string>,
  encrypt: (keyId: string, text: string) => Promise<string>,
  generateDataKey: (masterKeyId: string) => Promise<GeneratedDataKey>,
}
export interface GeneratedDataKey {
  readonly ciphertextBlob: string;
  readonly plainText: string;
}