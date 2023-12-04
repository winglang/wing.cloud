import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WRPCProvider } from "@wingcloud/wrpc";
import { useState } from "react";
import { RouterProvider } from "react-router-dom";

import { NotificationsProvider } from "./design-system/notification.js";
import { DefaultTheme, ThemeProvider } from "./design-system/theme-provider.js";
import { router } from "./router.jsx";
import { PopupWindowProvider } from "./utils/popup-window-provider.js";

const API_URL = new URL(location.origin);
API_URL.pathname = "/wrpc";

export const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WRPCProvider value={{ url: API_URL.toString() }}>
        <ThemeProvider mode="light" theme={DefaultTheme}>
          <NotificationsProvider>
            <PopupWindowProvider>
              <RouterProvider router={router} />
            </PopupWindowProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </WRPCProvider>
    </QueryClientProvider>
  );
};
