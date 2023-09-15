import { getEnvironmentVariable } from "@wingcloud/get-environment-variable";
import fetch from "node-fetch";

import type {
  GitHubLogin,
  GitHubTokens,
  GithubProject,
} from "../types/github.js";

const GITHUB_APP_CLIENT_ID = getEnvironmentVariable("GITHUB_APP_CLIENT_ID");
const GITHUB_APP_CLIENT_SECRET = getEnvironmentVariable(
  "GITHUB_APP_CLIENT_SECRET",
);

const exchangeCodeForTokens = async (code: string): Promise<GitHubTokens> => {
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
    throw new Error("Failed to fetch user information.", { cause: response });
  }

  return (await response.json()) as UserInfo;
};

export const listUserProjects = async (token: string) => {
  const response = await fetch("https://api.github.com/user/repos", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": GITHUB_APP_CLIENT_ID,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user information.", { cause: response });
  }

  return (await response.json()) as GithubProject[];
};

export const getGitHubLoginFromCode = async (code: string) => {
  const tokens = await exchangeCodeForTokens(code);

  const { login } = await getUserInfo(tokens.access_token);

  return {
    login,
    tokens,
  };
};
