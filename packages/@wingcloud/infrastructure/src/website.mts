import serverlessExpress from "@vendia/serverless-express";
import express from "express";

// @ts-ignore-next-line
import { handler as ssrHandler } from "../../website/lib/dist/server/entry.mjs";

const app = express();
// Change this based on your astro.config.mjs, `base` option.
// They should match. The default value is "/".
// const base = "/";
// app.use(base, express.static("dist/client/"));
app.use(ssrHandler);

// app.listen(8080);
export const handler = serverlessExpress({
  app,
});

interface WingApiRequest {
  body?: string;
  headers?: Record<string, string | undefined>;
  method: string;
  path: string;
  query?: Record<string, string>;
  vars?: Record<string, string>;
}

interface WingApiResponse {
  status: number;
  body: string;
  headers?: Record<string, string | undefined>;
}

interface ExpressAdapterResponse {
  statusCode: number;
  body: string;
  multiValueHeaders: Record<string, string[]>;
  isBase64Encoded: boolean;
}

export const handlerAdapter = async (
  event: WingApiRequest,
): Promise<WingApiResponse> => {
  const response: ExpressAdapterResponse = await handler(
    {
      path: event.path,
      requestContext: {
        http: {
          method: event.method,
          path: "/",
        },
      },
    },
    {} as any,
    () => {},
  );
  console.log({ response });
  return {
    status: response.statusCode,
    body: response.body,
    headers: Object.fromEntries(
      Object.entries(response.multiValueHeaders).map(([key, value]) => [
        key,
        value[0],
      ]),
    ),
  };
};
