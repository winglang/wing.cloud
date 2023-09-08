import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { APIRoute } from "astro";

import { createContext } from "../../routers/context.js";
import { appRouter as router } from "../../routers/index.js";

export const all: APIRoute = ({ request: req }) => {
  return fetchRequestHandler({
    endpoint: "/trpc",
    req,
    router,
    createContext,
  });
};
