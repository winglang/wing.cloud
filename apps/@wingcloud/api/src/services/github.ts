import { getEnvironmentVariable } from "@wingcloud/get-environment-variable";
import fetch from "node-fetch";
import { App, Octokit } from "octokit";

import {
  gitHubLoginFromString,
  type GitHubLogin,
  type GitHubTokens,
} from "../types/github.js";

const GITHUB_APP_CLIENT_ID = getEnvironmentVariable("GITHUB_APP_CLIENT_ID");
const GITHUB_APP_CLIENT_SECRET = getEnvironmentVariable(
  "GITHUB_APP_CLIENT_SECRET",
);
const GITHUB_APP_ID = getEnvironmentVariable("GITHUB_APP_ID");
const GITHUB_APP_PRIVATE_KEY = getEnvironmentVariable("GITHUB_APP_PRIVATE_KEY");

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

export const getGitHubLoginFromCode = async (code: string) => {
  const tokens = await exchangeCodeForTokens(code);

  const { login } = await getUser(tokens.access_token);

  return {
    login: login as GitHubLogin,
    tokens,
  };
};

export const getUser = async (token: string) => {
  const octokit = new Octokit({
    auth: token,
  });
  const { data: user } = await octokit.request("GET /user");
  return { ...user, login: gitHubLoginFromString(user.login) };
};

export const listUserInstallations = async (token: string) => {
  const octokit = new Octokit({
    auth: token,
  });

  const { data: installations } =
    await octokit.rest.apps.listInstallationsForAuthenticatedUser();
  return installations.installations;
};

export const listInstallationRepos = async (
  token: string,
  installationId: number,
) => {
  const octokit = new Octokit({
    auth: token,
  });

  const { data: orgRepos } =
    await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
      installation_id: installationId,
    });

  return orgRepos.repositories;
};
