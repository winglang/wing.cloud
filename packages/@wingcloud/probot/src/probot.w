bring cloud;
bring "./octokit.w" as octokit;

struct ProbotRepositoryOwner {
	name: str;
	login: str;
}

struct ProbotRepository {
	id: str;
	name: str;
	owner: ProbotRepositoryOwner;
	full_name: str;
}

struct PullRequestHead {
	sha: str;
	ref: str;
}

struct PullRequestPR {
	head: PullRequestHead;
	number: num;
	title: str;
}

struct PullRequestInstallation {
	id: num;
}

struct PullRequestPayload {
	number: num;
	repository: ProbotRepository;
	pull_request: PullRequestPR;
	installation: PullRequestInstallation?;
}

pub struct Context {
	id: str;
	octokit: octokit.OctoKit;
}

pub struct PullRequestContext extends Context {
	payload: PullRequestPayload;
}

pub struct PullRequestSynchronizeContext extends PullRequestContext {}

pub struct PullRequestOpenedContext extends PullRequestContext {}

pub struct PullRequestClosedContext extends PullRequestContext {}

struct PushPayload {
	repository: ProbotRepository;
	installation: PullRequestInstallation?;
	after: str;
	ref: str;
}

pub struct PushContext extends Context {
	payload: PushPayload;
}

pub struct VerifyAndReceieveOptions {
	id: str;
	name: str;
	signature: str;
	payload: str;
}

pub interface ProbotWebhooks {
	inflight on(name: str, handler: inflight (): void);
	inflight verifyAndReceive(props: VerifyAndReceieveOptions);
}

pub interface ProbotAuth {
	inflight call(ProbotAdapter, installationId: num): octokit.OctoKit;
}

pub struct ProbotAdapter {
	webhooks: ProbotWebhooks;
	auth: ProbotAuth;
}

pub struct ProbotProps {
	appId: str;
	privateKey: str;
	webhookSecret: str;
}

pub class Probot {
	appId: str;
	privateKey: str;
	webhookSecret: str;
	topic: cloud.Topic;

	var handlerIndex: num;

	pub url: str;

	new(props: ProbotProps) {
		this.appId = props.appId;
		this.privateKey = props.privateKey;
		this.webhookSecret = props.webhookSecret;

		this.handlerIndex = 0;

		this.topic = new cloud.Topic();
		// std.Node.of(this.topic).hidden = true;

		let api = new cloud.Api();
		// std.Node.of(api).hidden = true;

    api.get("/", inflight () => {
      return {
        status: 200,
        body: "ok",
      };
    });

		api.post("/", inflight (request) => {
			let options = VerifyAndReceieveOptions.fromJson({
				id: request.headers?.tryGet("x-github-delivery"),
				name: request.headers?.tryGet("x-github-event"),
				signature: request.headers?.tryGet("x-hub-signature-256"),
				payload: request.body,
			});
			this.topic.publish(Json.stringify(options));
			return {
				status: 200,
			};
		});

		this.url = api.url;
	}

	inflight adapter: ProbotAdapter;

	extern "./probot.ts" static inflight createProbotAdapter(props: ProbotProps): ProbotAdapter;

	inflight new() {
		this.adapter = Probot.createProbotAdapter(
			appId: this.appId,
			privateKey: this.privateKey,
			webhookSecret: this.webhookSecret,
		);
	}

	onMessage(name: str, handler: inflight (): void) {
		let self = this;
		class Handler {
			inflight handle(event: str): void {
				self.adapter.webhooks.on(name, handler);
				self.adapter.webhooks.verifyAndReceive(
					VerifyAndReceieveOptions.fromJson(
						Json.parse(event),
					),
				);
			}
		}
		this.handlerIndex += 1;
		let handlerWrapper = new Handler() as "onMessage-{this.handlerIndex}";
		std.Node.of(handlerWrapper).hidden = true;
		let listener = this.topic.onMessage(handlerWrapper);
		std.Node.of(listener).title = "on: {name}";
	}

	pub onPullRequestOpened(handler: inflight (PullRequestOpenedContext): void) {
		this.onMessage("pull_request.opened", handler);
	}

	pub onPullRequestReopened(handler: inflight (PullRequestOpenedContext): void) {
		this.onMessage("pull_request.reopened", handler);
	}

	pub onPullRequestSynchronize(handler: inflight (PullRequestSynchronizeContext): void) {
		this.onMessage("pull_request.synchronize", handler);
	}

	pub onPullRequestClosed(handler: inflight (PullRequestClosedContext): void) {
		this.onMessage("pull_request.closed", handler);
	}

	pub onPush(handler: inflight (PushContext): void) {
		this.onMessage("push", handler);
	}

	pub inflight auth(installationId: num): octokit.OctoKit {
		return this.adapter.auth.call(this.adapter, installationId);
	}
}
