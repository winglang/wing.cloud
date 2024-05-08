export default interface extern {
  createGithubAppJwt: (appId: string, privateKey: string) => Promise<string>,
}
