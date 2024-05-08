export default interface extern {
  generate: () => Promise<KeyPairResult>,
  sign: (payload: string, options: SignOptions) => Promise<string>,
  verify: (options: VerifyOptions) => Promise<(Readonly<Record<string, string>>) | undefined>,
}
export interface KeyPairResult {
  readonly privateKey: string;
  readonly publicKey: string;
}
export interface SignOptions {
  readonly data: Readonly<Record<string, string>>;
  readonly issuer: string;
  readonly privateKey: string;
}
export interface VerifyOptions {
  readonly publicKey: string;
  readonly token: string;
}