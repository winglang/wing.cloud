import { createProbot as createProbotAdapter } from "@probot/adapter-aws-lambda-serverless";

export const createProbot = async (
  appId: string,
  privateKey: string,
  webhookSecret: string,
) => {
  const probot = createProbotAdapter({
    overrides: {
      appId,
      privateKey: privateKey.trim().replaceAll("\\n", "\n"),
      secret: webhookSecret,
    },
  });
  return probot;
};
