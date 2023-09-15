import { getEnvironmentVariable } from "@wingcloud/get-environment-variable";
import fetch from "node-fetch";
import { App, Octokit } from "octokit";

import type { GitHubTokens } from "../types/github.js";

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
    login,
    tokens,
  };
};

export const getUser = async (token: string) => {
  const octokit = new Octokit({
    auth: token,
  });
  const { data: user } = await octokit.request("GET /user");
  return user;
};

export const listUserProjects = async (token: string) => {
  const octokit = new Octokit({
    auth: token,
  });

  const { data: projects } =
    await octokit.rest.repos.listForAuthenticatedUser();
  return projects;
};

export const listUserOrganizations = async (token: string) => {
  const octokit = new Octokit({
    auth: token,
  });

  const { data: organizations } =
    await octokit.rest.orgs.listForAuthenticatedUser();
  return organizations;
};

export const getOrganizationInstallation = async (
  token: string,
  orgId: number,
) => {
  const app = new App({
    appId: GITHUB_APP_ID,
    privateKey: GITHUB_APP_PRIVATE_KEY,
  });

  const { data: orgInstallation } = await app.octokit.request(
    "GET /orgs/{org}/installation",
    {
      org: `${orgId}`,
    },
  );

  return orgInstallation;
};

export const listInstallationRepositories = async (token: string) => {
  const app = new App({
    appId: GITHUB_APP_ID,
    privateKey: GITHUB_APP_PRIVATE_KEY,
  });
  const octokit = new Octokit({
    auth: token,
  });

  const userOrgs = await listUserOrganizations(token);

  let repositories = [] as {
    id: number;
    name: string;
  }[];

  for (const org of userOrgs) {
    const orgInstallation = await getOrganizationInstallation(token, org.id);

    const { data: orgRepos } =
      await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
        installation_id: orgInstallation.id,
      });

    repositories = [...repositories, ...orgRepos.repositories];
  }

  const user = await getUser(token);

  const { data: userInstallation } = await app.octokit.request(
    "GET /users/{username}/installation",
    {
      username: user.login,
    },
  );

  const { data: userRepos } =
    await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
      installation_id: userInstallation.id,
    });

  repositories = [...repositories, ...userRepos.repositories];

  return repositories;
};
