import type { GitHubLogin } from "../types/github.js";

const GITHUB_APP_CLIENT_ID = import.meta.env.GITHUB_APP_CLIENT_ID;
const GITHUB_APP_CLIENT_SECRET = import.meta.env.GITHUB_APP_CLIENT_SECRET;

export interface GitHubTokens {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
  scope: string;
}

const exchangeCodeForTokens = async (code: string): Promise<GitHubTokens> => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_APP_CLIENT_ID,
      client_secret: GITHUB_APP_CLIENT_SECRET,
      code: code,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for access token.", {
      cause: response,
    });
  }

  const json = await response.json();
  console.log("exchangeCode", json);
  return json;
};

interface UserInfo {
  login: GitHubLogin;
  name: string | undefined;
  gravatar_url: string | undefined;
}

const getUserInfo = async (token: string): Promise<UserInfo> => {
  const response = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": GITHUB_APP_CLIENT_ID,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(response.statusText);
    throw new Error("Failed to fetch user information.");
  }

  const json = await response.json();
  console.log("getUserInfo", json);
  return json;
};

export const getGitHubLoginFromCode = async (code: string) => {
  const tokens = await exchangeCodeForTokens(code);

  const { login } = await getUserInfo(tokens.access_token);

  return {
    login,
    tokens,
  };
};

/**
 * The URL to redirect the user to in order to start the GitHub OAuth flow.
 */
export const authorizeURL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_APP_CLIENT_ID}`;
