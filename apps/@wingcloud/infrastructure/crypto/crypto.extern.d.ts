export default interface extern {
  decrypt: (key: string, encrypted: Data) => Promise<string>,
  encrypt: (key: string, data: string) => Promise<Data>,
}
export interface Data {
  readonly iv: string;
  readonly text: string;
}