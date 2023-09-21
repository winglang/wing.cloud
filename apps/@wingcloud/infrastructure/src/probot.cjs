/**
 * @param {import("probot").Probot} app
 */

const APP_USER = "wingcloudtest[bot]";

const removeExistingComment = async (context) => {
  const comments = await context.octokit.issues.listComments(context.issue());
  for (const comment of comments.data) {
    if (comment.user.login === APP_USER) {
      await context.octokit.issues.deleteComment({
        owner: context.repo().owner,
        repo: context.repo().repo,
        comment_id: comment.id,
      });
    }
  }
};

const getEntryPoints = async (context) => {
  const pullRequest = context.payload.pull_request;
  const files = await context.octokit.pulls.listFiles({
    owner: context.repo().owner,
    repo: context.repo().repo,
    pull_number: pullRequest.number,
  });

  const filePaths = files.data
    .filter((file) => file.filename.endsWith("main.w"))
    .map((file) => file.filename);

  return filePaths;
};

const createPullRequestComment = async (context, entryPoints) => {
  const repo = context.payload.repository.name;
  const branch = context.payload.pull_request.head.ref;
  const previewLink = `https://wing.cloud/org/${repo}/${branch}`;

  const status = "✅ Ready";
  const tests = [
    "✅ [sanity](https://wing.cloud/org/repo/branch/logs/tests/sanity)",
    "✅ [E2E](https://wing.cloud/org/repo/branch/logs/tests/E2E)",
  ];

  const entries = entryPoints.map((entryPoint) => {
    const filename = entryPoint.split("/").pop();
    const githubFileLink = `https://github.com/${context.repo().owner}/${
      context.repo().repo
    }/blob/${context.payload.pull_request.head.ref}/${entryPoint}`;

    return {
      name: filename,
      file: entryPoint,
      githubFileLink,
      status: status,
      previewLink: previewLink,
      tests: tests,
      updated: new Date().toUTCString(),
    };
  });

  const tableRows = entries.map((entry) => {
    return `| [${entry.name}](${entry.githubFileLink}) | ${
      entry.status
    } ([logs](${previewLink}/logs/build/)) | [Visit Preview](${
      entry.previewLink
    }) | ${entry.tests.join("<br>")} | ${entry.updated} |`;
  });

  const commentBody = `
| Entry Point     | Status | Preview | Tests | Updated (UTC) |
| --------------- | ------ | ------- | ----- | -------------- |
${tableRows.join("\n")}
`;

  const params = context.issue({ body: commentBody });
  await removeExistingComment(context);
  await context.octokit.issues.createComment(params);
};

const appFn = async (app) => {
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    return context.octokit.issues.createComment(issueComment);
  });

  app.on("pull_request.opened", async (context) => {
    const entryPoints = await getEntryPoints(context);
    return createPullRequestComment(context, entryPoints);
  });

  app.on("pull_request.edited", async (context) => {
    const entryPoints = await getEntryPoints(context);
    return createPullRequestComment(context, entryPoints);
  });
};

const {
  createLambdaFunction,
  createProbot,
} = require("@probot/adapter-aws-lambda-serverless");

let webhooks;

module.exports.handler = async (appId, privateKey, event) => {
  webhooks ??= createLambdaFunction(appFn, {
    probot: createProbot({
      overrides: {
        appId,
        privateKey,
      },
    }),
  });

  return webhooks(event);
};
