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

