import {
  useQuery,
  useMutation,
  type UseMutationOptions,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import { createContext, useContext } from "react";

const WRPCContext = createContext({ url: "" });

export const WRPCProvider = WRPCContext.Provider;

export type QueryProcedure<
  Input = unknown,
  Output = unknown,
> = undefined extends Input
  ? {
      useQuery(
        input?: Input,
        options?: UseQueryOptions<unknown, unknown, Input>,
      ): UseQueryResult<Output>;
    }
  : {
      useQuery(
        input: Input,
        options?: UseQueryOptions<unknown, unknown, Output>,
      ): UseQueryResult<Output>;
    };

export type MutationProcedure<Input = unknown, Output = unknown> = {
  useMutation(
    options?: UseMutationOptions<Output, unknown, Input>,
  ): UseMutationResult<Output, unknown, Input>;
};

const fetcher = async (method: string, url: URL, input?: any) => {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: input ? JSON.stringify(input) : undefined,
  });
  if (!response.ok) {
    const { error } = await response.json();
    if (response.status === 401 || error === "Unauthorized") {
      location.href = "/";
    }
    throw new Error(error);
  }
  return response.json();
};

export const createWRPCReact = <
  Router extends Record<string, any>,
>(): Router => {
  return new Proxy(
    {},
    {
      get: (_target, route: any) => {
        return {
          useQuery: (input: any, options: UseQueryOptions) => {
            const url = new URL(`${useContext(WRPCContext).url}/${route}`);
            if (input) {
              for (const [key, value] of Object.entries(input)) {
                url.searchParams.append(key, `${value}`);
              }
            }
            return useQuery({
              ...options,
              queryKey: [route, input],
              queryFn: async () => await fetcher("GET", url),
            });
          },
          useMutation: (options: UseMutationOptions) => {
            const url = new URL(`${useContext(WRPCContext).url}/${route}`);
            return useMutation({
              ...options,
              mutationFn: async (input) => await fetcher("POST", url, input),
            });
          },
        };
      },
    },
  ) as any;
};
