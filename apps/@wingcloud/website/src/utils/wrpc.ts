import {
  createWRPCReact,
  type MutationProcedure,
  type QueryProcedure,
} from "@wingcloud/wrpc";

export const wrpc = createWRPCReact<{
  "github.callback": QueryProcedure<{ code: string }, {}>;
  "github.listInstallations": QueryProcedure<
    undefined,
    {
      installations: Array<{
        id: number;
        account: { login: string };
      }>;
    }
  >;
  "github.listRepositories": QueryProcedure<
    { installationId: string },
    {
      repositories: Array<{
        id: number;
        name: string;
      }>;
    }
  >;
  "project.rename": MutationProcedure<{ id: string; name: string }, {}>;
  "user.listProjects": QueryProcedure<
    undefined,
    {
      projects: Array<{ projectId: string; name: string }>;
    }
  >;
  "user.createProject": MutationProcedure<{
    repositoryId: string;
    projectName: string;
  }>;
}>();
