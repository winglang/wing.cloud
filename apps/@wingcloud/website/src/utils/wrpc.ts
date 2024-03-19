import {
  createWRPCReact,
  type InfinitQueryProcedure,
  type MutationProcedure,
  type QueryProcedure,
  type PaginatedResponse,
} from "@wingcloud/wrpc";

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  email: string;
}

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
}

interface Commit {
  sha: string;
  message: string;
  date: string;
}

export type EnvironmentStatus =
  | "initializing"
  | "running-server"
  | "running-tests"
  | "deploying"
  | "running"
  | "tests-error"
  | "error"
  | "stopped";

export const STARTING_STATUS: EnvironmentStatus[] = [
  "initializing",
  "running-server",
  "running-tests",
  "deploying",
];

export interface App {
  appId: string;
  appName: string;
  appFullName?: string;
  description: string;
  repoId: string;
  repoName: string;
  repoOwner: string;
  userId: string;
  entrypoint: string;
  createdAt: string;
  defaultBranch?: string;
  lastCommitMessage?: string;
  lastCommitDate?: string;
  lastCommitSha?: string;
  status?: EnvironmentStatus;
}

export interface TestResult {
  path: string;
  pass: boolean;
}

interface TestResults {
  testResults: TestResult[];
}

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
  timestamp: string;
}

export interface Trace {
  message: string;
  timestamp: string;
}

export interface TestLog {
  id: string;
  path: string;
  pass: boolean;
  error: string;
  time: number;
  timestamp: string;
  traces: Trace[];
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

export interface Endpoint {
  id: string;
  appId: string;
  runId: string;
  environmentId: string;
  path: string;
  label: string;
  browserSupport: boolean;
  localUrl: string;
  publicUrl: string;
  port: number;
  digest: string;
  createdAt: string;
  updatedAt: string;
}

export const wrpc = createWRPCReact<{
  "ws.invalidateQuery.auth": QueryProcedure<
    undefined,
    {
      token: string;
      subscriptionId: string;
    }
  >;
  "auth.check": QueryProcedure<
    undefined,
    {
      user: User;
    }
  >;
  "auth.signOut": MutationProcedure;
  "github.callback": QueryProcedure<{ code: string }, {}>;
  "github.listInstallations": InfinitQueryProcedure<
    undefined,
    PaginatedResponse<Installation[]>
  >;
  "github.listRepositories": InfinitQueryProcedure<
    { installationId: string },
    PaginatedResponse<Repository[]>
  >;
  "github.getRepository": QueryProcedure<
    { owner: string; repo: string },
    {
      repository: Repository;
    }
  >;
  "app.getByName": QueryProcedure<
    { owner: string; appName: string },
    {
      app: App;
    }
  >;
  "app.listEnvironments": QueryProcedure<
    { owner: string; appName: string },
    {
      environments: Environment[];
    }
  >;
  "app.environment": QueryProcedure<
    { owner: string; appName: string; branch: string },
    {
      environment: Environment;
    }
  >;
  "app.environment.restart": MutationProcedure<
    { owner: string; appName: string; branch: string },
    {}
  >;
  "app.environment.logs": QueryProcedure<
    { owner: string; appName: string; branch: string },
    {
      deploy: Log[];
      runtime: Log[];
      tests: TestLog[];
    }
  >;
  "app.environment.endpoints": QueryProcedure<
    { appName: string; branch: string },
    {
      endpoints: Endpoint[];
    }
  >;
  "app.listSecrets": QueryProcedure<
    { appId: string },
    {
      secrets: Secret[];
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
    { secret: Secret }
  >;
  "app.deleteSecret": MutationProcedure<
    { appId: string; environmentType: string; secretId: string },
    {}
  >;
  "app.listEntrypoints": QueryProcedure<
    { owner: string; repo: string; default_branch: string },
    {
      entrypoints: string[];
    }
  >;
  "app.updateEntrypoint": MutationProcedure<
    { appId: string; entrypoint: string },
    {}
  >;
  "app.updateDescription": MutationProcedure<
    { appId: string; description: string },
    {}
  >;
  "app.delete": MutationProcedure<{ owner: string; appName: string }, {}>;
  "app.list": QueryProcedure<
    {
      owner: string;
    },
    {
      apps: App[];
    }
  >;
  "app.create": MutationProcedure<
    {
      owner: string;
      appName: string;
      description: string;
      repoName: string;
      repoOwner: string;
      defaultBranch: string;
    },
    {
      app: App;
    }
  >;
  "admin.users.list": QueryProcedure<
    undefined,
    {
      users: User[];
    }
  >;
}>();
