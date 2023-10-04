import {
  Probot,
  createLambdaFunction,
  createProbot as createProbotAdapter,
} from "@probot/adapter-aws-lambda-serverless";

let webhooks;

const appFn = async (app: Probot) => {
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    // const p = await app.auth({ type: "" });
    const r = await context.octokit.issues.listComments()
    
    return context.octokit.issues.createComment(issueComment);
  });

  app.on("pull_request.opened", async (context) => {
    const tree = await context.octokit.git.getTree({
      owner: "",
      repo: ",",
      tree_sha: "",
      recursive: ""
    })
    
    context.payload.pull_request;
    const t = await context.octokit.apps.createInstallationAccessToken({ installation_id: context.payload.installation!.id })
    t.data.token;
    t.status;
    
    const ss = await context.octokit.pulls.listFiles();
    
    // const entryPoints = await getEntryPoints(context);
    // return createPullRequestComment(context, entryPoints);
  });

  app.on("pull_request.synchronize", async (context) => {
    const tree = await context.octokit.git.getTree({
      owner: "",
      repo: ",",
      tree_sha: "",
      recursive: ""
    })
    // context.payload.installation.id
    // context.payload.nu
    const t = await context.octokit.apps.createInstallationAccessToken({ installation_id: context.payload.installation!.id })
    t.data.token;
    t.status;

    let p = createProbotAdapter({
      overrides: {},
    });

    (await p.auth()).apps.listInstallations()
    let l = p.auth(3);
    // l.
    
    const ss = await context.octokit.pulls.listFiles();
  });
};

// module.exports.handler = async (appId: string, privateKey: string, event: any) => {
//   let probot = createProbot({
//     overrides: {
//       appId,
//       privateKey,
//     },
//   });

//   probot.webhooks.receive({
//     id: "",
//     payload: {} as any,
//     name: "create"
//   })
//   let webhooks = createLambdaFunction(appFn, {
//     probot: createProbot({
//       overrides: {
//         appId,
//         privateKey,
//       },
//     }),
//   });

//   // return webhooks()
// };

export const createProbot = async (appId: string, privateKey: string, event: any) => {
  const probot = createProbotAdapter({
    overrides: {
      appId,
      privateKey: privateKey.trim().replace(/\\n/g, "\n", ),
    },
  });
  return probot;
};