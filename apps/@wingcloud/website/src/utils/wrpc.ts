import {
  createWRPCReact,
  type MutationProcedure,
  type QueryProcedure,
} from "@wingcloud/wrpc";

export const wrpc = createWRPCReact<{
  "github.callback": QueryProcedure<{ code: string }, {}>;
  "project.rename": MutationProcedure<{ id: string; name: string }, {}>;
  "user.listProjects": QueryProcedure<
    undefined,
    {
      projects: Array<{ projectId: string; name: string }>;
    }
  >;
}>();
