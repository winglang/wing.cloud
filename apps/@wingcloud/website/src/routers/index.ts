import { initTRPC } from "@trpc/server";
import { z } from "zod";

import type { Context } from "./context.js";

type User = {
  id: string;
  name: string;
  bio?: string;
};

const users: Record<string, User> = {};

export const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  getUserById: t.procedure.query(() => {
    return "user";
  }),
  // createUser: t.procedure
  //   .input(
  //     z.object({
  //       name: z.string().min(3),
  //       bio: z.string().max(142).optional(),
  //     }),
  //   )
  //   .mutation((opts) => {
  //     const id = Date.now().toString();
  //     const user: User = { id, ...opts.input };
  //     users[user.id] = user;
  //     return user;
  //   }),
});

export type AppRouter = typeof appRouter;
