import {
  createWRPCReact,
  type MutationProcedure,
  type QueryProcedure,
} from "@wingcloud/wrpc";

export interface Repository {
  id: number;
  name: string;
  private: boolean;
  owner: { login: string; avatar_url: string };
  default_branch: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  repository: string;
  userId: string;
  entryfile: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

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
      repositories: Array<Repository>;
    }
  >;
  "project.get": QueryProcedure<
    { id: string },
    {
      project: { id: string; name: string; repository: string; userId: string };
    }
  >;
  "project.rename": MutationProcedure<
    { id: string; name: string; repository: string },
    {}
  >;
  "user.listProjects": QueryProcedure<
    undefined,
    {
      projects: Array<Project>;
    }
  >;
  "user.createProject": MutationProcedure<{
    repositoryId: string;
    repositoryName: string;
    owner: string;
    default_branch: string;
    projectName: string;
    entryfile: string;
    imageUrl?: string;
  }>;
}>();
