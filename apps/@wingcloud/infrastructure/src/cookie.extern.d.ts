export default interface extern {
  parse: (value: string) => Promise<Readonly<Record<string, string>>>,
  serialize: (name: string, value: string, options?: (SerializeOptions) | undefined) => Promise<string>,
}
export interface SerializeOptions {
  readonly domain?: (string) | undefined;
  readonly expires?: (number) | undefined;
  readonly httpOnly?: (boolean) | undefined;
  readonly maxAge?: (number) | undefined;
  readonly path?: (string) | undefined;
  readonly sameSite?: (string) | undefined;
  readonly secure?: (boolean) | undefined;
}