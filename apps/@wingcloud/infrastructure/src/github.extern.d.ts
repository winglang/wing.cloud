export default interface extern {
  getLastCommit: (options: GetLastCommitOptions) => Promise<CommitResponse>,
  getPullRequest: (options: GetPullRequestOptions) => Promise<PullRequest>,
  getRepository: (options: GetRepositoryOptions) => Promise<Repository>,
  getUser: (accessToken: string) => Promise<GitHubUser>,
  listInstallationRepos: (token: string, installationId: number, page?: (number) | undefined) => Promise<ListRepositoryResponse>,
  listUserInstallations: (token: string, page?: (number) | undefined) => Promise<ListUserInstallationsResponse>,
}
export interface GetLastCommitOptions {
  readonly default_branch: string;
  readonly owner: string;
  readonly repo: string;
  readonly token: string;
}
export interface Author {
  readonly date?: (string) | undefined;
  readonly email?: (string) | undefined;
  readonly name?: (string) | undefined;
}
export interface Commit {
  readonly author: Author;
  readonly message: string;
}
export interface CommitResponse {
  readonly commit: Commit;
  readonly sha: string;
}
export interface GetPullRequestOptions {
  readonly owner: string;
  readonly pull_number: string;
  readonly repo: string;
  readonly token: string;
}
export interface PullRequest {
  readonly body: string;
  readonly id: number;
  readonly number: number;
  readonly title: string;
}
export interface GetRepositoryOptions {
  readonly owner: string;
  readonly repo: string;
  readonly token: string;
}
export interface Owner {
  readonly avatar_url: string;
  readonly login: string;
}
export interface Repository {
  readonly default_branch: string;
  readonly description?: (string) | undefined;
  readonly full_name: string;
  readonly id: number;
  readonly name: string;
  readonly owner: Owner;
  readonly private: boolean;
}
export interface GitHubUser {
  readonly avatar_url?: (string) | undefined;
  readonly email?: (string) | undefined;
  readonly login: string;
  readonly name?: (string) | undefined;
}
export interface InstallationRepository {
  readonly name: string;
}
export interface ListRepositoryResponse {
  readonly data: (readonly (InstallationRepository)[]);
  readonly nextPage?: (number) | undefined;
  readonly prevPage?: (number) | undefined;
  readonly total: number;
}
export interface UserAccount {
  readonly login: string;
}
export interface UserInstallation {
  readonly account: UserAccount;
  readonly id: number;
}
export interface ListUserInstallationsResponse {
  readonly data: (readonly (UserInstallation)[]);
  readonly nextPage?: (number) | undefined;
  readonly prevPage?: (number) | undefined;
  readonly total: number;
}