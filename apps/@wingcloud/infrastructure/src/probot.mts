import { createProbot as createProbotAdapter } from "@probot/adapter-aws-lambda-serverless";

export const createProbot = async (
  appId: string,
  privateKey: string,
  webhookSecret: string,
) => {
  console.log("createProbot");
  const probot = createProbotAdapter({
    overrides: {
      appId,
      privateKey: privateKey.trim().replaceAll("\\n", "\n"),
      secret: webhookSecret,
    },
  });
  probot.onError((c) => {
    console.log("probot error", c.message);
  });
  return probot;
};
