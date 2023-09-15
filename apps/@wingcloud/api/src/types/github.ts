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

export type GithubProject = {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
  };
  html_url: string;
  description: string;
};
