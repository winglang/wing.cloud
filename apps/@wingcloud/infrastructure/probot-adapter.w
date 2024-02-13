bring "./types/octokit-types.w" as octokit;
bring "./types/probot-types.w" as probot;

pub struct ProbotAdapterProps {
  probotAppId: str;
  probotSecretKey: str;
  webhookSecret: str;
}

pub class ProbotAdapter {
  extern "./src/probot.mts" pub static inflight createProbot(appId: str, privateKey: str, webhookSecret: str): probot.ProbotInstance;

  pub appId: str;
  pub secretKey: str;
  pub webhookSecret: str;
  inflight var instance: probot.ProbotInstance?;

  new(props: ProbotAdapterProps) {
    this.appId =  props.probotAppId;
    this.secretKey = props.probotSecretKey;
    this.webhookSecret = props.webhookSecret;
  }

  inflight new() {
    this.instance = ProbotAdapter.createProbot(this.appId, this.secretKey, this.webhookSecret);
  }

  pub inflight handlePullRequstOpened(handler: inflight (probot.IPullRequestOpenedContext): void) {
    log("this.instance?.webhooks?.on('pull_request.opened', handler);");
    this.instance?.webhooks?.on("pull_request.opened", handler);
  }

  pub inflight handlePullRequstReopened(handler: inflight (probot.IPullRequestOpenedContext): void) {
    log("this.instance?.webhooks?.on('pull_request.reopened', handler);");
    this.instance?.webhooks?.on("pull_request.reopened", handler);
  }

  pub inflight handlePullRequstSync(handler: inflight (probot.IPullRequestSyncContext): void) {
    this.instance?.webhooks?.on("pull_request.synchronize", handler);
  }

  pub inflight handlePullRequstClosed(handler: inflight (probot.IPullRequestClosedContext): void) {
    this.instance?.webhooks?.on("pull_request.closed", handler);
  }

  pub inflight handlePush(handler: inflight (probot.IPushContext): void) {
    this.instance?.webhooks?.on("push", handler);
  }

  pub inflight verifyAndReceive(props: probot.VerifyAndReceieveProps) {
    log("this.instance?.webhooks?.verifyAndReceive(props);");
    this.instance?.webhooks?.verifyAndReceive(props);
  }

  pub inflight auth(installationId: num): octokit.OctoKit {
    // use unsafeCast because of the circular type reference
    if let kit = this.instance?.auth?.call(unsafeCast(this.instance), installationId) {
      return kit;
    } else {
      throw "auth: fail to get octokit";
    }
  }
}
