import { useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect } from "react";

import { EventBusContext } from "./eventbus-provider.js";
import { type App } from "./wrpc.js";

const Context = createContext<undefined>(undefined);

/**
 * A workaround for invalidating queries on the client side and execute side effects for specific queries in order to improve the UX.
 * This provider should be removed once we will have a better websocket support in the future.
 * @param children
 * @constructor
 */
export const QuerySideEffectsProvider = ({ children }: PropsWithChildren) => {
  const { removeEventListener, addEventListener } = useContext(EventBusContext);
  const queryClient = useQueryClient();
  useEffect(() => {
    const onErrorHandler = (event: Event) => {
      const { queryKey } = (
        event as CustomEvent<{
          queryKey: string;
          variables: Record<string, any>;
        }>
      ).detail;
      switch (queryKey) {
        case "app.delete": {
          queryClient.invalidateQueries({ queryKey: ["app.list"] });
          return;
        }
      }
    };
    const onMutateHandler = (event: Event) => {
      const { queryKey, variables } = (
        event as CustomEvent<{
          queryKey: string;
          variables: Record<string, any>;
        }>
      ).detail;

      switch (queryKey) {
        case "app.delete": {
          queryClient.setQueriesData(
            {
              queryKey: ["app.list"],
            },
            (apps: { apps: App[] } | undefined) => {
              if (!variables || !variables["appName"]) return apps;
              //optimistic remove the deleted app from the list
              const newApps =
                apps?.apps?.filter(
                  (app) => app.appName !== variables["appName"],
                ) || [];
              return { apps: newApps };
            },
          );
          return;
        }
      }
    };
    const onSuccessHandler = (event: Event) => {
      const { queryKey, variables } = (
        event as CustomEvent<{
          queryKey: string;
          variables: Record<string, any>;
        }>
      ).detail;
      switch (queryKey) {
        case "app.create": {
          queryClient.refetchQueries({ queryKey: ["app.list"] });
          return;
        }
        case "app.delete": {
          queryClient.invalidateQueries({ queryKey: ["app.list"] });
          queryClient.setQueriesData(
            { queryKey: ["app.listEnvironments", { ...variables }] },
            {
              environments: [],
            },
          );
        }
      }
    };
    addEventListener("custom:on-success:query-side-effect", onSuccessHandler);
    addEventListener("custom:on-mutate:query-side-effect", onMutateHandler);
    addEventListener("custom:on-error:query-side-effect", onErrorHandler);
    return () => {
      removeEventListener(
        "custom:on-success:query-side-effect",
        onSuccessHandler,
      );
      removeEventListener(
        "custom:on-mutate:query-side-effect",
        onMutateHandler,
      );
      removeEventListener("custom:on-error:query-side-effect", onErrorHandler);
    };
  }, [addEventListener, removeEventListener, queryClient]);
  return <Context.Provider value={undefined}>{children}</Context.Provider>;
};
