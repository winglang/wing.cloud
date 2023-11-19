import { createProbot } from "@probot/adapter-aws-lambda-serverless";

export interface CreateProbotAdapterOptions {
  appId: number;
  privateKey: string;
  webhookSecret: string;
}

export const createProbotAdapter = async (
  options: CreateProbotAdapterOptions,
) => {
  const probot = createProbot({
    overrides: {
      appId: options.appId,
      privateKey: options.privateKey,
      secret: options.webhookSecret,
    },
  });
  probot.onError((event) => {
    console.error("probot error", event.message);
  });
  return probot;
};
