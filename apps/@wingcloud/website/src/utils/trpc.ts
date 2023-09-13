import { createTRPCReact } from "@trpc/react-query";
import type { Router } from "@wingcloud/api";

export const trpc = createTRPCReact<Router>();
