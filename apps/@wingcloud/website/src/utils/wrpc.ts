import {
  createWRPCReact,
  type MutationProcedure,
  type QueryProcedure,
} from "@wingcloud/wrpc";

export interface Installation {
  id: number;
  account: { login: string };
}

export interface Repository {
  id: number;
  name: string;
  description: string | null;
  full_name: string;
  private: boolean;
  owner: { login: string; avatar_url: string };
  default_branch: string;
  html_url: string;
}

export interface App {
  appId: string;
  appName: string;
  description: string;
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

export interface TestResult {
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

export type EnvironmentStatus =
  | "initializing"
  | "tests"
  | "deploying"
  | "running"
  | "error";

export interface Environment {
  id: string;
  appId: string;
  type: string;
  repo: string;
  branch: string;
  status: EnvironmentStatus;
  installationId: number;
  prNumber: number;
  prTitle: string;
  url?: string;
  commentId?: number;
  testResults?: TestResults;
  createdAt: string;
  updatedAt: string;
}

export interface Log {
  message: string;
  timestamp: number;
}

export interface Secret {
  id: string;
  appId: string;
  name: string;
  environmentType: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export type EnvironmentType = "produciton" | "preview";

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
      installations: Array<Installation>;
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
    { appName: string; branch: string },
    {
      environment: Environment;
    }
  >;
  "app.environment.logs": QueryProcedure<
    { appName: string; branch: string },
    {
      build: Log[];
      tests: Log[];
    }
  >;
  "app.listSecrets": QueryProcedure<
    { appId: string },
    {
      secrets: Array<Secret>;
    }
  >;
  "app.decryptSecret": MutationProcedure<
    { appId: string; secretId: string; environmentType: string },
    { value: string }
  >;
  "app.createSecret": MutationProcedure<
    {
      appId: string;
      environmentType: EnvironmentType;
      name: string;
      value: string;
    },
    {}
  >;
  "app.deleteSecret": MutationProcedure<
    { appId: string; environmentType: string; secretId: string },
    {}
  >;
  "app.listEntryfiles": QueryProcedure<
    { owner: string; repo: string; default_branch: string },
    {
      entryfiles: Array<string>;
    }
  >;
  "app.updateEntryfile": MutationProcedure<
    { appId: string; appName: string; repoId: string; entryfile: string },
    {}
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
      description: string;
      repoName: string;
      repoOwner: string;
      default_branch: string;
      appName: string;
      entryfile: string;
      imageUrl?: string;
      installationId: string;
    },
    {
      appId: string;
      appName: string;
    }
  >;
}>();
