bring cloud;
bring http;
bring ex;
bring util;
bring "./runtime/runtime-callbacks.w" as runtime_callbacks;
bring "./runtime/runtime.w" as runtime;
bring "./probot.w" as probot;

// And the sun, and the moon, and the stars, and the flowers.

struct WebsiteFiles {
  cwd: str;
  files: Array<str>;
}

class AstroWebsite  {
  // extern "./src/list-website-files.cjs" static getFiles(): WebsiteFiles;
  extern "./src/website.mts" static inflight handlerAdapter(event: cloud.ApiRequest): cloud.ApiResponse;

  init() {
    let api = new cloud.Api() as "Api";

    let web = new cloud.Website(
      path: "../website/lib/dist/client"
    );
  }
}

let runtimeCallbacks = new runtime_callbacks.RuntimeCallbacks();

let wingApi = new cloud.Api() as "wing api";
wingApi.post("/report", inflight (req) => {
  runtimeCallbacks.topic.publish(req.body ?? "");

  return {
    status: 200
  };
});

let rntm = new runtime.RuntimeService(wingApi.url);
new probot.ProbotApp(rntm.api.url, runtimeCallbacks);

let website = new ex.ReactApp(
  projectPath: "../website",
  startCommand: "pnpm dev --port 5174",
  buildCommand: "pnpm build",
 );
