import {
  Mutation,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { WRPCProvider } from "@wingcloud/wrpc";
import { useContext, useState } from "react";
import { RouterProvider } from "react-router-dom";

import { NotificationsProvider } from "./design-system/notification.js";
import { DefaultTheme, ThemeProvider } from "./design-system/theme-provider.js";
import { router } from "./router.jsx";
import { AnalyticsIdentityProvider } from "./utils/analytics-identity-provider.js";
import { AnalyticsContext } from "./utils/analytics-provider.js";
import { EventBusContext } from "./utils/eventbus-provider.js";
import { PopupWindowProvider } from "./utils/popup-window-provider.js";
import { QuerySideEffectsProvider } from "./utils/query-side-effects-provider.js";
import { useAnalyticsEvents } from "./utils/use-analytics-events.js";

const API_URL = new URL(location.origin);
API_URL.pathname = "/wrpc";

export const App = () => {
  const { track } = useContext(AnalyticsContext);
  const { dispatchEvent } = useContext(EventBusContext);
  const { handleEvent: handleAnalyticsEvent } = useAnalyticsEvents({ track });

  const [queryClient] = useState(() => {
    const mutationEventDispatcher = (
      state: "on-success" | "on-mutate" | "on-error",
      mutation: Mutation<any, any, any, any>,
      variables: Record<string, any>,
    ) => {
      if (
        mutation.options.mutationKey &&
        mutation.options.mutationKey[0] &&
        typeof mutation.options.mutationKey[0] === "string"
      ) {
        dispatchEvent(
          new CustomEvent(`custom:${state}:query-side-effect`, {
            detail: {
              queryKey: mutation.options.mutationKey[0],
              variables: variables as Record<string, any>,
            },
          }),
        );
      }
    };

    return new QueryClient({
      queryCache: new QueryCache({
        onSuccess: (data, query) => {
          if (query.queryKey[0] && typeof query.queryKey[0] === "string") {
            handleAnalyticsEvent(
              query.queryKey[0],
              query.queryKey[1] as Record<string, any>,
            );
            dispatchEvent(
              new CustomEvent("custom:on-success:query-side-effect", {
                detail: {
                  queryKey: query.queryKey[0],
                  variables: query.queryKey[1],
                },
              }),
            );
          }
        },
      }),
      mutationCache: new MutationCache({
        onMutate: (variables, mutation) => {
          mutationEventDispatcher(
            "on-mutate",
            mutation,
            variables as Record<string, any>,
          );
        },
        onSuccess: (data, variables, context, mutation) => {
          mutationEventDispatcher(
            "on-success",
            mutation,
            variables as Record<string, any>,
          );
          if (
            mutation.options.mutationKey &&
            mutation.options.mutationKey[0] &&
            typeof mutation.options.mutationKey[0] === "string"
          ) {
            handleAnalyticsEvent(
              mutation.options.mutationKey[0],
              variables as Record<string, any>,
            );
          }
        },
        onError: (error, variables, context, mutation) => {
          mutationEventDispatcher(
            "on-error",
            mutation,
            variables as Record<string, any>,
          );
        },
      }),
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <WRPCProvider value={{ url: API_URL.toString() }}>
        <AnalyticsIdentityProvider>
          <ThemeProvider mode="light" theme={DefaultTheme}>
            <NotificationsProvider>
              <QuerySideEffectsProvider>
                <PopupWindowProvider>
                  <RouterProvider router={router} />
                </PopupWindowProvider>
              </QuerySideEffectsProvider>
            </NotificationsProvider>
          </ThemeProvider>
        </AnalyticsIdentityProvider>
      </WRPCProvider>
    </QueryClientProvider>
  );
};
