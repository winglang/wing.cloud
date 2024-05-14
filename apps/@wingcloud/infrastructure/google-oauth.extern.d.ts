export default interface extern {
  getRedirectURL: (options: GetRedirectURLOptions) => Promise<string>,
}
export interface GetRedirectURLOptions {
  readonly clientID: string;
  readonly redirectURI: string;
  readonly state: string;
}