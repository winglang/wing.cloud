import fetch from "node-fetch";

import type { GitHubLogin } from "../types/github.js";

export interface GitHubTokens {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
  scope: string;
}

const exchangeCodeForTokens = async (code: string): Promise<GitHubTokens> => {
  const GITHUB_APP_CLIENT_ID = process.env["GITHUB_APP_CLIENT_ID"];
  const GITHUB_APP_CLIENT_SECRET = process.env["GITHUB_APP_CLIENT_SECRET"];

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      code: code,
      client_id: GITHUB_APP_CLIENT_ID,
      client_secret: GITHUB_APP_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for access token", {
      cause: response,
    });
  }

  return (await response.json()) as GitHubTokens;
};

interface UserInfo {
  login: GitHubLogin;
  name: string | undefined;
  gravatar_url: string | undefined;
}

const getUserInfo = async (token: string): Promise<UserInfo> => {
  const GITHUB_APP_CLIENT_ID = process.env["GITHUB_APP_CLIENT_ID"] || "";
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

  return (await response.json()) as UserInfo;
};

export const getGitHubLoginFromCode = async (code: string) => {
  const tokens = await exchangeCodeForTokens(code);

  const { login } = await getUserInfo(tokens.access_token);

  return {
    login,
    tokens,
  };
};
