import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { WRPCProvider } from "@wingcloud/wrpc";
import { useCallback, useContext, useState } from "react";
import { RouterProvider } from "react-router-dom";

import { AppLoaderSkeleton } from "./components/app-loader-skeleton.js";
import { CurrentAppDataProvider } from "./data-store/app-data-provider.js";
import { AppsDataProvider } from "./data-store/apps-data-provider.js";
import { AuthDataProvider } from "./data-store/auth-data-provider.js";
import { InstallationsDataProvider } from "./data-store/installations-data-provider.js";
import { ReposDataProvider } from "./data-store/repos-data-provider.js";
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

  const [routesReady, setRoutesReady] = useState(false);
  const onRouterReady = useCallback(() => {
    if (routesReady) {
      return;
    }
    setRoutesReady(true);
  }, [routesReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <WRPCProvider value={{ url: API_URL.toString() }}>
        <InvalidateQueryProvider url={WS_URL.toString()}>
          <AuthDataProvider>
            <AnalyticsIdentityProvider>
              <ThemeProvider mode="light" theme={DefaultTheme}>
                <NotificationsProvider>
                  <PopupWindowProvider>
                    <AppsDataProvider>
                      <CurrentAppDataProvider>
                        <InstallationsDataProvider>
                          <ReposDataProvider>
                            {!routesReady && <AppLoaderSkeleton />}
                            <RouterProvider router={router(onRouterReady)} />
                          </ReposDataProvider>
                        </InstallationsDataProvider>
                      </CurrentAppDataProvider>
                    </AppsDataProvider>
                  </PopupWindowProvider>
                </NotificationsProvider>
              </ThemeProvider>
            </AnalyticsIdentityProvider>
          </AuthDataProvider>
        </InvalidateQueryProvider>
      </WRPCProvider>
    </QueryClientProvider>
  );
};
