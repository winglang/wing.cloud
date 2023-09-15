import type { OpaqueType } from "@wingcloud/opaque-type";

/**
 * Represents a GitHub login name.
 */
export type GitHubLogin = OpaqueType<string, { readonly t: unique symbol }>;

/**
 * Creates a GitHub login from a string.
 */
export const gitHubLoginFromString = (login: string): GitHubLogin => {
  // There's no fancy logic we can use to validate a GitHub user login, so we just trust it.
  return login as GitHubLogin;
};

export type GitHubTokens = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
  scope: string;
};

/**
 * Represents a GitHub repository ID.
 *
 * @example "winglang/wing"
 */
export type GitHubRepositoryId = OpaqueType<
  `${string}/${string}`,
  { readonly t: unique symbol }
>;

/**
 * Creates a GitHub repository ID from a string.
 */
export const gitHubRepositoryIdFromString = (
  owner: string,
  repository: string,
): GitHubRepositoryId => {
  return `${owner}/${repository}` as GitHubRepositoryId;
};
