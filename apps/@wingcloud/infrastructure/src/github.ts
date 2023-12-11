// import fetch from "node-fetch";
import { Octokit } from "octokit";

export const getUser = async (accessToken: string) => {
  const octokit = new Octokit({
    auth: accessToken,
  });
  const { data: user } = await octokit.request("GET /user");
  return user;
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
  page = 1,
) => {
  const octokit = new Octokit({
    auth: token,
  });

  const perPage = 10;

  // https://docs.github.com/en/rest/apps/installations?apiVersion=2022-11-28#list-repositories-accessible-to-the-user-access-token
  const { data: orgRepos } =
    await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
      installation_id: installationId,
      page,
      per_page: perPage,
    });

  return {
    page,
    perPage,
    total: orgRepos.total_count,
    repositories: orgRepos.repositories,
  };
};

export const getLastCommit = async ({
  token,
  owner,
  repo,
  default_branch,
}: {
  token: string;
  owner: string;
  repo: string;
  default_branch: string;
}) => {
  const octokit = new Octokit({
    auth: token,
  });

  try {
    const { data: commit } = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: default_branch,
    });

    return commit;
  } catch (error) {
    console.log(error);
  }

  return "commit not found";
};

export const getRepository = async ({
  token,
  owner,
  repo,
}: {
  token: string;
  owner: string;
  repo: string;
}) => {
  const octokit = new Octokit({
    auth: token,
  });

  const { data: repository } = await octokit.rest.repos.get({
    owner,
    repo,
  });

  return repository;
};

export const getPullRequest = async ({
  token,
  owner,
  repo,
  pull_number,
}: {
  token: string;
  owner: string;
  repo: string;
  pull_number: number;
}) => {
  const octokit = new Octokit({
    auth: token,
  });

  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
  });

  return pullRequest;
};
