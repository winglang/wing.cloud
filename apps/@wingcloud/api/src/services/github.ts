import { getEnvironmentVariable } from "@wingcloud/get-environment-variable";
import fetch from "node-fetch";
import { App, Octokit } from "octokit";

import type { GitHubTokens } from "../types/github.js";

const GITHUB_APP_CLIENT_ID = getEnvironmentVariable("GITHUB_APP_CLIENT_ID");
const GITHUB_APP_CLIENT_SECRET = getEnvironmentVariable(
  "GITHUB_APP_CLIENT_SECRET",
);
const GITHUB_APP_ID = getEnvironmentVariable("GITHUB_APP_ID");
//const GITHUB_APP_PRIVATE_KEY = getEnvironmentVariable("GITHUB_APP_PRIVATE_KEY");
const GITHUB_APP_PRIVATE_KEY =
  "-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEAuEgC2muPwjOkaoeUiOAl3CTVi9dT5pLsDl358jb8agkxD+ff\nTWZja/L9vIwb+QI6Z3dtdVempDJJ0XyN6loCDHKDXpQUqew0Nw4iivPDN0rjeem9\nXwkBfYlunXOPVDAHaWyh0BcTu4xw18KsF6nx1kb5zVTSk3fIOQ12NGp3siyulhGs\ng64rItXfX7x6YB184LUiPZqupvtBk7wbJzN9pzP2E5RUTW8xbnLNI6DrpyvRDq6W\nQkTOIZQ/nomYWVERG1cTGcIV1PhM9JmQsemZvSzqS3KWwJDe3FCe1/hbd8jS1BRN\nS/7WaI/4o7bY43y7+yhT4UUMbLlS1UufWCqIrQIDAQABAoIBAAOOmEeBBgBYoNbR\nkSNnODPcniaZ3Gu58EaCt91eBFdDoCfPcPb8f/TIdu9ZwPx4d4ohuwIl0/idY+Fg\nRxj77cgxualssE1rWsKpSi9mbyE1F9j1kwsvkFDNA06UuXKFjs8RIrpyh5X6Kv9v\nKYU3aYyaSB4Xgg0Ipdu8D8kJORA+VinMpK7z8cKqqYYUYgg003ibYwDO2RyFRm7+\nIwGweatSEBFc5qRqlzww8OOlZisrpLVbhOSUdNBWGTnAUVCmuB1OLgwWXKQ3Wy+2\nhO/mlRBuERpQ9NER8+4fCtoD1TfVdD5ILy+KIhc61n5IyOVP5wGJyDZ87mQCjmyr\nRiN0aP0CgYEA2gEQp4eJIxWj0zE5wCRctGapIt6xGwLWD4soIwkJD2FAZ6UpPBF4\nakPFRtHf/+oynhFfbV9ZyCbTbm6J4PBovF7XW2Rdk8xmQqlsEF3nYICZokD16UD9\nHD6rNwEfdT7+lHO8BL5vuuOHBEVigHV3uczkgaGJGRyAOdjNCxy6nNsCgYEA2GZL\nmMxCB1IeYQcRLKgM8Kk6a2XSuZzIHSKRine4BK03EeL9nFGSEUdhAxBUSOqLic6D\n7ZJNs3QxoHJETpZvKGl3jSgN8qMuy/MA2RWSuVXYYnlf6gCI1QRBCOpWuiwbYQkJ\nQ4yvXACyzOGcwgxQoY9yNvmvOcAlLWFWJMfFoxcCgYAdDZNIoFl4YYPpu1+06aOp\nLx1PVlpH/ULF44e/045vjEhnB63NIY7oqot5+rJdirqgMjSDgPeYIwR+bSDW53Mt\n133f4ipObikarTWHoNwbEkhnRT0AjvascvWiaPXmTDTlV98wyqhdQcFWomCUOhNw\noYu6cuqwfAniq6/30SZVjQKBgHCPXRkgfePi8gxUKbnJu9lenRWKBD8p7ulAtuWI\nej5sfu2d3X726vxz3WFDmCPJZEWNFxB2/lWuxbWIWkFqfG1P1rCkugSQnuHVB4bj\ncstWfNRT//Du0D3FFbL2eaAjGyaxFZF+VySK9HYfkHNbBoHS5Hz2CRAIAw6Ex9Mf\n2oyHAoGAU7eBBQQu3323auzREG9tyUVqLAcgldUrgoDJuaYfgy1936vBksJqlbc/\nDN6rPaRobSpNdq/XdZsQO5PLsYkSn/Hq/jDyXzbi6O6E3BU6uZZS5rBwNgUkVdiL\nzM6cLzwOgbzQO5L3lPlgMjKZXoK/a2dW/cHYpwvbUTIIOeL48yw=\n-----END RSA PRIVATE KEY-----";

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
