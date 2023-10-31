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
        full_name: string;
      }>;
    }
  >;
  "project.get": QueryProcedure<
    { id: string },
    {
      project: { id: string; name: string; repository: string; userId: string };
    }
  >;
  "project.rename": MutationProcedure<{ id: string; name: string, repository: string }, {}>;
  "user.listProjects": QueryProcedure<
    undefined,
    {
      projects: Array<{
        id: string;
        name: string;
        repository: string;
        userId: string;
        entryfile: string;
      }>;
    }
  >;
  "user.createProject": MutationProcedure<{
    repositoryId: string;
    projectName: string;
    entryfile: string;
  }>;
}>();
