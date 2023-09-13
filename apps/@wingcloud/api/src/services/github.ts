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
  const clientId = process.env["GITHUB_APP_CLIENT_ID"];
  const clientSecret = process.env["GITHUB_APP_CLIENT_SECRET"];

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      ContentType: "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as any;
    throw new Error(
      `Failed to exchange code for access token. error: ${error.error}`,
      {
        cause: response,
      },
    );
  }

  return (await response.json()) as GitHubTokens;
};

interface UserInfo {
  login: GitHubLogin;
  name: string | undefined;
  gravatar_url: string | undefined;
}

const getUserInfo = async (token: string): Promise<UserInfo> => {
  const clientId = process.env["GITHUB_APP_CLIENT_ID"] || "";

  const response = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Accept: "application/json",
      UserAgent: clientId,
      ContentType: "application/json",
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

  //const { login } = await getUserInfo(tokens.access_token);

  return {
    login: "test" as GitHubLogin,
    tokens,
  };
};
