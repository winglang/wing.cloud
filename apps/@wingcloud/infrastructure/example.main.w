bring cloud;
bring util;
bring "./node_modules/@wingcloud/probot/src/probot.w" as probot;
bring "./node_modules/@wingcloud/containers/src/containers.w" as containers;

let probot_ = new probot.Probot(
  appId: util.env("BOT_GITHUB_APP_ID"),
  privateKey: util.env("BOT_GITHUB_PRIVATE_KEY"),
  webhookSecret: util.env("BOT_GITHUB_WEBHOOK_SECRET"),
);

let containers_ = new containers.Containers(
  // driver: "fly",
);

new cloud.Service(inflight () => {
  let container = containers_.create(
    // image: "flyio/hellofly:latest",
    image: "flyio/fastify-functions:latest",
    port: 8080,
    readiness: "/",
  );
  log("containerID = {container.containerID.value}, containerURL = {container.url}");
}) as "Create a container";

probot_.onPullRequestOpened(inflight (context) => {
	log("pull request opened");

	let branch = context.payload.pull_request.head.ref;
	let repository = context.payload.repository.full_name;
	let pullRequestNumber = context.payload.pull_request.number;

	log("branch = {branch}");
	log("repository = {repository}");
	log("pullRequestNumber = {pullRequestNumber}");
});

probot_.onPullRequestClosed(inflight (context) => {
	log("pull request closed");

	let branch = context.payload.pull_request.head.ref;
	let repository = context.payload.repository.full_name;

	log("branch = {branch}");
	log("repository = {repository}");
});

probot_.onPush(inflight (context) => {
	log("push");

	let branch = context.payload.ref;
	let repository = context.payload.repository.full_name;

	log("branch = {branch}");
	log("repository = {repository}");
});

if util.tryEnv("WING_TARGET") == "sim" {
	bring "./node_modules/@wingcloud/ngrok/index.w" as ngrok;
	let ngrok_ = new ngrok.Ngrok(
		url: probot_.url,
		domain: util.tryEnv("NGROK_DOMAIN"),
	);
	new cloud.Service(inflight () => {
		log("ngrok.url = {ngrok_.url} -> {probot_.url}");
	}) as "Report ngrok URL";
}
