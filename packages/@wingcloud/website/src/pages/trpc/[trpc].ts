import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { APIRoute } from "astro";

import { createContext } from "../../router/context.js";
import { appRouter } from "../../router/index.js";

export const all: APIRoute = ({ request }) => {
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: request,
    router: appRouter,
    createContext,
  });
};
