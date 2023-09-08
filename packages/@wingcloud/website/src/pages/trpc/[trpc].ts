import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { APIRoute } from "astro";

import { createContext } from "../../routers/context.js";
import { appRouter } from "../../routers/index.js";

export const all: APIRoute = ({ request }) => {
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: request,
    router: appRouter,
    createContext,
  });
};
