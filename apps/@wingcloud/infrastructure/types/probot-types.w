bring "./octokit-types.w" as octokit;

struct IProbotRepositoryOwner {
  name: str;
  login: str;
}

struct IProbotRepository {
  name: str;
  owner: IProbotRepositoryOwner;
}

struct IPullRequestHead {
  sha: str;
}

struct IPullRequestPR {
  head: IPullRequestHead;
  number: num;
}

struct IPullRequestInstallation {
  id: num;
}

struct IPullRequestPayload {
  number: num;
  repository: IProbotRepository;
  pull_request: IPullRequestPR;
  installation: IPullRequestInstallation?;
}

pub struct IPullRequestSyncContext {
  id: str;
  payload: IPullRequestPayload;
  octokit: octokit.OctoKit;
}

pub struct IPullRequestOpenedContext {
  id: str;
  payload: IPullRequestPayload;
  octokit: octokit.OctoKit;
}
