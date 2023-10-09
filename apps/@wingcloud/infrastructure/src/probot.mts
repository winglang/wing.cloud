import {
  createProbot as createProbotAdapter,
} from "@probot/adapter-aws-lambda-serverless";

export const createProbot = async (appId: string, privateKey: string, event: any) => {
  const probot = createProbotAdapter({
    overrides: {
      appId,
      privateKey: privateKey.trim().replace(/\\n/g, "\n", ),
    },
  });
  return probot;
};
