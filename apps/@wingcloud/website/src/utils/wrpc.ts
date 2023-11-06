import {
  createWRPCReact,
  type MutationProcedure,
  type QueryProcedure,
} from "@wingcloud/wrpc";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: { login: string; avatar_url: string };
  default_branch: string;
}

export interface App {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  repository: string;
  userId: string;
  entryfile: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  lastCommitMessage?: string;
}

export const wrpc = createWRPCReact<{
  "auth.check": QueryProcedure<{}>;
  "auth.signout": MutationProcedure<{}>;
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
  "app.get": QueryProcedure<
    { id: string },
    {
      app: { id: string; name: string; repository: string; userId: string };
    }
  >;
  "app.rename": MutationProcedure<
    { id: string; name: string; repository: string },
    {}
  >;
  "user.listApps": QueryProcedure<
    undefined,
    {
      apps: Array<App>;
    }
  >;
  "user.createApp": MutationProcedure<{
    repositoryId: string;
    repositoryName: string;
    owner: string;
    default_branch: string;
    appName: string;
    entryfile: string;
    imageUrl?: string;
  }>;
}>();
