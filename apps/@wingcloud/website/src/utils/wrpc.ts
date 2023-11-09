import {
  createWRPCReact,
  type MutationProcedure,
  type QueryProcedure,
} from "@wingcloud/wrpc";

export interface Repository {
  id: number;
  name: string;
  description?: string;
  full_name: string;
  private: boolean;
  owner: { login: string; avatar_url: string };
  default_branch: string;
  html_url: string;
}

export interface App {
  appId: string;
  appName: string;
  description?: string;
  imageUrl?: string;
  repoId: string;
  repoName: string;
  repoOwner: string;
  userId: string;
  entryfile: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  lastCommitMessage?: string;
}

interface TestResult {
  path: string;
  pass: boolean;
}

interface TestResults {
  testResults: Array<TestResult>;
}

interface StatusReport {
  environmentId: string;
  status: string;
}

interface TestStatusReport extends StatusReport {
  data: TestResults;
}

export interface Environment {
  id: string;
  appId: string;
  repo: string;
  branch: string;
  status: string;
  prNumber: number;
  prTitle: string;
  installationId: number;
  url?: string;
  commentId?: number;
  createdAt: string;
  updatedAt: string;
  testResults?: TestStatusReport;
}

export const wrpc = createWRPCReact<{
  "auth.check": QueryProcedure<
    undefined,
    {
      userId: string;
      username: string;
    }
  >;
  "auth.signout": MutationProcedure;
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
  "github.getRepository": QueryProcedure<
    { owner: string; repo: string },
    {
      repository: Repository;
    }
  >;
  "app.get": QueryProcedure<
    { appId: string },
    {
      app: App;
    }
  >;
  "app.getByName": QueryProcedure<
    { appName: string },
    {
      app: App;
    }
  >;
  "app.environments": QueryProcedure<
    { appId: string },
    {
      environments: Array<Environment>;
    }
  >;
  "app.environment": QueryProcedure<
    { environmentId: string },
    {
      environment: Environment;
    }
  >;
  "app.rename": MutationProcedure<
    { appId: string; appName: string; repository: string },
    {}
  >;
  "app.delete": MutationProcedure<{ appId: string }, {}>;
  "user.listApps": QueryProcedure<
    undefined,
    {
      apps: Array<App>;
    }
  >;
  "user.createApp": MutationProcedure<
    {
      repoId: string;
      description?: string;
      repoName: string;
      repoOwner: string;
      default_branch: string;
      appName: string;
      entryfile: string;
      imageUrl?: string;
    },
    {
      appId: string;
    }
  >;
}>();
