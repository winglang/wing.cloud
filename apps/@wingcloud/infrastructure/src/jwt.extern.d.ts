export default interface extern {
  sign: (options: SignOptions) => Promise<string>,
  verify: (options: VerifyOptions) => Promise<JWTPayload>,
}
export interface SignOptions {
  readonly email?: (string) | undefined;
  readonly expirationTime?: (string) | undefined;
  readonly isAdmin: boolean;
  readonly secret: string;
  readonly userId: string;
  readonly username: string;
}
export interface VerifyOptions {
  readonly jwt: string;
  readonly secret: string;
}
export interface JWTPayload {
  readonly email?: (string) | undefined;
  readonly isAdmin: boolean;
  readonly userId: string;
  readonly username: string;
}