import {
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
import { InvalidateQueryProvider } from "./utils/invalidate-query-provider.js";
import { PopupWindowProvider } from "./utils/popup-window-provider.js";
import { useAnalyticsEvents } from "./utils/use-analytics-events.js";

const API_URL = new URL(location.origin);
API_URL.pathname = "/wrpc";

// @ts-ignore
const WS_URL = new URL(window["wingEnv"]["WS_URL"]);
WS_URL.pathname = "/ws";
WS_URL.protocol = "ws" + WS_URL.protocol.slice(4);

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
        <InvalidateQueryProvider url={WS_URL.toString()}>
          <AnalyticsIdentityProvider>
            <ThemeProvider mode="light" theme={DefaultTheme}>
              <NotificationsProvider>
                <PopupWindowProvider>
                  <RouterProvider router={router} />
                </PopupWindowProvider>
              </NotificationsProvider>
            </ThemeProvider>
          </AnalyticsIdentityProvider>
        </InvalidateQueryProvider>
      </WRPCProvider>
    </QueryClientProvider>
  );
};
