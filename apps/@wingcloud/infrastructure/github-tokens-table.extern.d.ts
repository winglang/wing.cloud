export default interface extern {
  decrypt: (text: string, key: string) => Promise<string>,
  encrypt: (text: string, key: string) => Promise<string>,
}
