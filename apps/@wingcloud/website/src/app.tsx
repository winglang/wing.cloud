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
import { PopupWindowProvider } from "./utils/popup-window-provider.js";

const API_URL = new URL(location.origin);
API_URL.pathname = "/wrpc";

export const App = () => {
  const { track } = useContext(AnalyticsContext);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onSuccess: (data, query) => {
            if (query.queryKey[0] && typeof query.queryKey[0] === "string") {
              track(
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
              track(
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
      <WRPCProvider value={{ url: API_URL.toString() }}>
        <AnalyticsIdentityProvider>
          <ThemeProvider mode="light" theme={DefaultTheme}>
            <NotificationsProvider>
              <PopupWindowProvider>
                <RouterProvider router={router} />
              </PopupWindowProvider>
            </NotificationsProvider>
          </ThemeProvider>
        </AnalyticsIdentityProvider>
      </WRPCProvider>
    </QueryClientProvider>
  );
};
