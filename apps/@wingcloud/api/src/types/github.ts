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
