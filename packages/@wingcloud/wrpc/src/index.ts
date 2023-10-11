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

export const createWRPCReact = <
  Router extends Record<string, any>,
>(): Router => {
  return new Proxy(
    {},
    {
      get: (_target, route: any) => {
        return {
          useQuery: (input: any, options: any) => {
            const url = new URL(`${useContext(WRPCContext).url}/${route}`);

            if (input) {
              for (const [key, value] of Object.entries(input)) {
                url.searchParams.append(key, `${value}`);
              }
            }
            return useQuery({
              queryKey: [route, input],
              queryFn: async () => {
                const response = await fetch(url, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                  },
                });
                return response.json();
              },
              ...options,
            });
          },
          useMutation: (options: any) => {
            const url = new URL(useContext(WRPCContext).url);
            return useMutation({
              mutationFn: async (input: any) => {
                const response = await fetch(url, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(input),
                });
                return response.json();
              },
              ...options,
            });
          },
        };
      },
    },
  ) as any;
};
