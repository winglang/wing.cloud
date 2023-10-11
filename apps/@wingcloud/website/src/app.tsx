import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WRPCProvider } from "@wingcloud/wrpc";
import { useState } from "react";
import { RouterProvider } from "react-router-dom";

import { router } from "./router.jsx";

const API_URL = (window as any)["wingEnv"].API_URL as string;

export const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WRPCProvider value={{ url: API_URL }}>
        <RouterProvider router={router} />
      </WRPCProvider>
    </QueryClientProvider>
  );
};
