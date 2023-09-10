import { Fly, FlyClient } from "../../../../packages/@wingcloud/flyiolib/index"

const getBucketName = () => {
  const key = Object.keys(process.env).find(k => k.startsWith("BUCKET_NAME_"));
  return process.env[key!]!;
}

export const handler = async (
  imageName: string,
  flyToken: string,
  wingApiUrl: string,
  awsAccessKeyId: string,
  awsSecretAccessKey: string
) => {
  const fly = new Fly(new FlyClient(flyToken));
  const app = fly.app("wing-runtime-flyio-test");
  await app.update({
    imageName: imageName,
    memoryMb: 1024,
    env: {
      LOGS_BUCKET_NAME: getBucketName(),
      WING_CLOUD_URL: wingApiUrl,
      AWS_ACCESS_KEY_ID: awsAccessKeyId, 
      AWS_SECRET_ACCESS_KEY: awsSecretAccessKey, 
      AWS_REGION: process.env["AWS_REGION"] || "us-east-1"
    },
    port: 3000
  });
}