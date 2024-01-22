import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { WRPCProvider } from "@wingcloud/wrpc";
import { useContext, useEffect, useState, type PropsWithChildren } from "react";
import { RouterProvider } from "react-router-dom";

import { NotificationsProvider } from "./design-system/notification.js";
import { DefaultTheme, ThemeProvider } from "./design-system/theme-provider.js";
import { router } from "./router.jsx";
import { AnalyticsIdentityProvider } from "./utils/analytics-identity-provider.js";
import { AnalyticsContext } from "./utils/analytics-provider.js";
import { PopupWindowProvider } from "./utils/popup-window-provider.js";
import { useAnalyticsEvents } from "./utils/use-analytics-events.js";
import { wrpc } from "./utils/wrpc.js";

const API_URL = new URL(location.origin);
API_URL.pathname = "/wrpc";

// @ts-ignore
const WS_URL = new URL(window["wingEnv"]["WS_URL"]);
WS_URL.pathname = "/ws";
WS_URL.protocol = "ws" + WS_URL.protocol.slice(4);

const QueryInvalidationProvider = ({ children }: PropsWithChildren) => {
  const auth = wrpc["auth.check"].useQuery();

  const ws = wrpc["app.invalidateQuery"].useSubscription(undefined, {
    enabled: !!auth.data,
    async onData(data) {
      console.log("app.invalidateQuery", data);

      // // eslint-disable-next-line unicorn/prefer-ternary
      // if (query) {
      //   await ( as any)[query]?.invalidate();
      // } else {
      //   await trpcContext.invalidate();
      // }
    },
    userId: auth.data?.user.id ?? "",
  });

  useEffect(() => {
    return () => {
      //ws.close();
    };
  }, []);
  return children;
};

export const App = () => {
  const { track } = useContext(AnalyticsContext);
  const { handleEvent } = useAnalyticsEvents({ track });
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onSuccess: (data, query) => {
            if (query.queryKey[0] && typeof query.queryKey[0] === "string") {
              handleEvent(
                query.queryKey[0],
                query.queryKey[1] as Record<string, any>,
              );
            }
          },
        }),
        mutationCache: new MutationCache({
          onSuccess: (data, variables, context, mutation) => {
            if (
              mutation.options.mutationKey &&
              mutation.options.mutationKey[0] &&
              typeof mutation.options.mutationKey[0] === "string"
            ) {
              handleEvent(
                mutation.options.mutationKey[0],
                variables as Record<string, any>,
              );
            }
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WRPCProvider value={{ url: API_URL.toString(), ws: WS_URL.toString() }}>
        <QueryInvalidationProvider>
          <AnalyticsIdentityProvider>
            <ThemeProvider mode="light" theme={DefaultTheme}>
              <NotificationsProvider>
                <PopupWindowProvider>
                  <RouterProvider router={router} />
                </PopupWindowProvider>
              </NotificationsProvider>
            </ThemeProvider>
          </AnalyticsIdentityProvider>
        </QueryInvalidationProvider>
      </WRPCProvider>
    </QueryClientProvider>
  );
};
