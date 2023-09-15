import type { CreateAPIServerOptions } from "./app.js";

export type { CreateAPIServerOptions } from "./app.js";
export { type Router } from "./routers/index.js";

/**
 * Creates an API server.
 */
export const createAPIServer = async (options: CreateAPIServerOptions) => {
  if (process.env["NODE_ENV"] === "development") {
    const { config } = await import("dotenv");
    config({
      path: new URL("../.env", import.meta.url),
    });
  }

  const { createAPIServer } = await import("./app.js");
  return createAPIServer(options);
};
