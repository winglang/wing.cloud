import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  type UseMutationOptions,
  type UseQueryOptions,
  type UseInfiniteQueryOptions,
  type UseQueryResult,
  type UseMutationResult,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { createContext, useContext } from "react";

const WRPCContext = createContext({ url: "" });

export const WRPCProvider = WRPCContext.Provider;

export class ControlledError extends Error {}

export class UnauthorizedError extends ControlledError {}

export class ForbiddenError extends ControlledError {}

export class NotFoundError extends ControlledError {}

export type QueryProcedure<
  Input = undefined,
  Output = unknown,
> = undefined extends Input
  ? {
      useQuery(
        input?: Input,
        options?: Omit<UseQueryOptions<unknown, unknown, Input>, "queryKey">,
      ): UseQueryResult<Output>;
    }
  : {
      useQuery(
        input: Input,
        options?: Omit<UseQueryOptions<unknown, unknown, Output>, "queryKey">,
      ): UseQueryResult<Output>;
    };

export type MutationProcedure<Input = undefined, Output = unknown> = {
  useMutation(
    options?: Omit<UseMutationOptions<Output, unknown, Input>, "queryKey">,
  ): UseMutationResult<Output, unknown, Input>;
};

export type InfinitQueryProcedure<
  Input = undefined,
  Output = unknown,
> = undefined extends Input
  ? {
      useInfiniteQuery(
        input?: Input,
        options?: Omit<
          UseInfiniteQueryOptions<unknown, unknown, Input>,
          "queryKey"
        >,
      ): UseInfiniteQueryResult<{
        pageParams: Array<unknown>;
        pages: Array<Output>;
      }>;
    }
  : {
      useInfiniteQuery(
        input: Input,
        options?: Omit<
          UseInfiniteQueryOptions<unknown, unknown, Output>,
          "queryKey"
        >,
      ): UseInfiniteQueryResult<{
        pageParams: Array<unknown>;
        pages: Array<Output>;
      }>;
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
    switch (response.status) {
      case 401: {
        throw new UnauthorizedError(error);
      }
      case 403: {
        throw new ForbiddenError(error);
      }
      case 404: {
        throw new NotFoundError(error);
      }
      default: {
        throw new Error(error);
      }
    }
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
              retry(failureCount, error) {
                if (error instanceof ControlledError) {
                  return false;
                }
                return failureCount < 3;
              },
              throwOnError: true,
              ...options,
              queryKey: [route, input],
              queryFn: async () => await fetcher("GET", url),
            });
          },
          useInfiniteQuery: (input: any, options: UseInfiniteQueryOptions) => {
            const url = new URL(`${useContext(WRPCContext).url}/${route}`);
            if (input) {
              for (const [key, value] of Object.entries(input)) {
                url.searchParams.append(key, `${value}`);
              }
            }
            return useInfiniteQuery({
              ...options,
              queryKey: [route, input],
              queryFn: async (params) => {
                url.searchParams.set("page", `${params.pageParam || 1}`);
                return fetcher("GET", url);
              },
              getNextPageParam: ({ page, perPage, total }) => {
                return page * perPage < total ? page + 1 : undefined;
              },
              getPreviousPageParam: ({ page }) => {
                return page > 1 ? page - 1 : undefined;
              },
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
