import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WRPCProvider } from "@wingcloud/wrpc";
import { useState } from "react";
import { RouterProvider } from "react-router-dom";

import { NotificationsProvider } from "./design-system/notification.js";
import { DefaultTheme, ThemeProvider } from "./design-system/theme-provider.js";
import { router } from "./router.jsx";

const API_URL = import.meta.env["VITE_API_URL"];
console.log({ API_URL });

export const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WRPCProvider value={{ url: API_URL }}>
        <ThemeProvider mode="light" theme={DefaultTheme}>
          <NotificationsProvider>
            <RouterProvider router={router} />
          </NotificationsProvider>
        </ThemeProvider>
      </WRPCProvider>
    </QueryClientProvider>
  );
};
