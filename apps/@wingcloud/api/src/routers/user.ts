import { t } from "../trpc.js";

export type User = {
  id: string;
  name: string;
  bio?: string;
};

export const router = t.router({
  getUserById: t.procedure.query(() => {
    return "user";
  }),
});
