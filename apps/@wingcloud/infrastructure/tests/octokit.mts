import { Octokit } from "@octokit/rest";

export const octokit = async (
  token: string,
) => {
  const octokit = new Octokit({
    auth: token,
  });
  return octokit.rest;
};
