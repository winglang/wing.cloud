import { testing, cloud } from '@winglang/sdk';
import { join, resolve } from "path";
import { handler } from '.';

const start = async () => {
  const sim = new testing.Simulator({ simfile: resolve(join(__dirname, "../../infrastructure/target/main.wsim")) });
  await sim.start();
  const logsBucket = sim.getResource("root/Default/Runtime/deployment logs") as cloud.IBucketClient;
  const wingApi = sim.getResource("root/Default/wing api") as cloud.Api; // TODO: should be cloud.IApiClient
  
  await handler({ logsBucket, wingApiUrl: wingApi.url });
};

start();