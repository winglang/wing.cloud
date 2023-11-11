import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WRPCProvider } from "@wingcloud/wrpc";
import { useState } from "react";
import { RouterProvider } from "react-router-dom";

import { Layout } from "./layout/layout.js";
import { router } from "./router.jsx";

const API_URL = new URL(location.origin);
API_URL.pathname = "/wrpc";

export const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WRPCProvider value={{ url: API_URL.toString() }}>
        <Layout>
          <RouterProvider router={router} />
        </Layout>
      </WRPCProvider>
    </QueryClientProvider>
  );
};
