// import fetch from "node-fetch";
import { Octokit } from "octokit";

export const getLoginFromAccessToken = async (accessToken: string) => {
  const octokit = new Octokit({
    auth: accessToken,
  });
  const { data: user } = await octokit.request("GET /user");
  return user.login;
};

// export const listUserInstallations = async (token: string) => {
//   const octokit = new Octokit({
//     auth: token,
//   });

//   const { data: installations } =
//     await octokit.rest.apps.listInstallationsForAuthenticatedUser();
//   return installations.installations;
// };

// export const listInstallationRepos = async (
//   token: string,
//   installationId: number,
// ) => {
//   const octokit = new Octokit({
//     auth: token,
//   });

//   const { data: orgRepos } =
//     await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
//       installation_id: installationId,
//     });

//   return orgRepos.repositories;
// };
