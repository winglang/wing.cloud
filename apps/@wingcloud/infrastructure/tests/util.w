bring dynamodb;
bring "../apps.w" as Apps;
bring "../environments.w" as Environments;
bring "../status-reports.w" as StatusReports;

pub class MakeTable {
  table: dynamodb.Table;
  new(name: str?) {
    this.table = new dynamodb.Table(
      attributes: [
        {
          name: "pk",
          type: "S",
        },
        {
          name: "sk",
          type: "S",
        },
      ],
      hashKey: "pk",
      rangeKey: "sk",
    );
  }

  pub get(): dynamodb.Table {
    return this.table;
  }
}

pub struct MakeAppDataOptions {
  appName: str?;
  repoId: str?;
  userId: str?;
}

pub class DataFactory {
  pub static inflight makeAppData(options: MakeAppDataOptions?): Apps.CreateAppOptions {
    return Apps.CreateAppOptions {
      appFullName: "appFullName",
      appName: options?.appName ?? "appName",
      createdAt: "2019-01-01T00:00:00Z",
      description: "description",
      defaultBranch: "main",
      entrypoint: "main.w",
      repoId: options?.repoId ?? "repoId",
      repoName: "repoName",
      repoOwner: "repoOwner",
      status: "running",
      userId: options?.userId ?? "userId",
    };
  }

  pub static inflight makeEnvironmentData(): Environments.CreateEnvironmentOptions {
    return Environments.CreateEnvironmentOptions {
      appId: "appId",
      type: "production",
      repo: "repo",
      branch: "main",
      sha: "sha",
      status: "running",
      prNumber: 1,
      prTitle: "prTitle",
      installationId: 1,
      publicKey: "publicKey",
    };
  }

  pub static inflight makeTestResults(): StatusReports.TestResults {
    return StatusReports.TestResults {
      testResults: [
        StatusReports.TestResult {
          path: "path",
          pass: true,
          id: "testId",
        }
      ],
    };
  }
}
