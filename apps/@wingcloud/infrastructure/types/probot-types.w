bring "./octokit-types.w" as octokit;

struct IProbotRepositoryOwner {
  name: str;
  login: str;
}

struct IProbotRepository {
  id: str;
  name: str;
  owner: IProbotRepositoryOwner;
  full_name: str;
}

struct IPullRequestHead {
  sha: str;
  ref: str;
}
struct IPullRequestUser {
  login: str;
}
struct IPullRequestPR {
  head: IPullRequestHead;
  user: IPullRequestUser;
  number: num;
  title: str;
  created_at: str?;
  updated_at: str?;
  closed_at: str?;
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

pub struct IContext {
  id: str;
  octokit: octokit.OctoKit;
}

pub struct IPullRequestContext extends IContext {
  payload: IPullRequestPayload;
}

pub struct IPullRequestSyncContext extends IPullRequestContext {}

pub struct IPullRequestOpenedContext extends IPullRequestContext {}

pub struct IPullRequestClosedContext extends IPullRequestContext {}

struct IPushPayload {
  repository: IProbotRepository;
  installation: IPullRequestInstallation?;
  after: str;
  ref: str;
}

pub struct IPushContext extends IContext {
  payload: IPushPayload;
}

pub struct VerifyAndReceieveProps {
  id: str;
  name: str;
  signature: str;
  payload: str;
}

pub interface IProbotWebhooks {
  inflight on(name: str, handler: inflight (): void);
  inflight verifyAndReceive(props: VerifyAndReceieveProps);
}

pub interface IProbotAuth {
  inflight call(ProbotInstance, installationId: num): octokit.OctoKit;
}

pub struct ProbotInstance {
  webhooks: IProbotWebhooks;
  auth: IProbotAuth;
}
