// import fetch from "node-fetch";
import { url } from "node:inspector";

import { Octokit } from "octokit";

const getNextPage = (page: number, total: number, perPage: number) => {
  if (total > page * perPage) {
    return page + 1;
  }
  return;
};

const getPreviousPage = (page: number) => {
  if (page > 1) {
    return page - 1;
  }
  return;
};

export const getUser = async (accessToken: string) => {
  const octokit = new Octokit({
    auth: accessToken,
  });
  const { data: user } = await octokit.request("GET /user");
  let email = user.email;
  if (!email) {
    const { data: emails } = await octokit.request("GET /user/emails");
    email = emails.find((email) => email.primary)?.email ?? "";
  }
  return {
    name: user.name,
    login: user.login,
    avatar_url: user.avatar_url ?? "",
    email,
  };
};

export const listUserInstallations = async (
  token: string,
  page = 1,
  perPage = 30,
) => {
  const octokit = new Octokit({
    auth: token,
  });

  const { data: installations } =
    await octokit.rest.apps.listInstallationsForAuthenticatedUser({
      page,
      // The number of results per page (max 100).
      // Default: 30
      per_page: perPage,
    });

  const data = installations.installations.map((installation) => ({
    id: installation.id,
    account: {
      login: (installation.account as any)?.login ?? "",
    },
  }));

  return {
    data,
    nextPage: getNextPage(page, installations.total_count, perPage),
    prevPage: getPreviousPage(page),
    total: installations.total_count,
  };
};

export const listInstallationRepos = async (
  token: string,
  installationId: number,
  page = 1,
  perPage = 30,
) => {
  const octokit = new Octokit({
    auth: token,
  });

  // https://docs.github.com/en/rest/apps/installations?apiVersion=2022-11-28#list-repositories-accessible-to-the-user-access-token
  const { data: orgRepos } =
    await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
      installation_id: installationId,
      page,
      // The number of results per page (max 100).
      // Default: 30
      per_page: perPage,
    });

  const data = orgRepos.repositories.map((repository) => ({
    id: repository.id,
    name: repository.name,
    full_name: repository.full_name,
    owner: {
      login: repository.owner.login,
      avatar_url: repository.owner.avatar_url,
    },
    default_branch: repository.default_branch,
    description: repository.description,
  }));

  return {
    data: data,
    nextPage: getNextPage(page, orgRepos.total_count, perPage),
    prevPage: getPreviousPage(page),
    total: orgRepos.total_count,
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
