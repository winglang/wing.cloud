import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WRPCProvider } from "@wingcloud/wrpc";
import { useState } from "react";
import { RouterProvider } from "react-router-dom";

import { router } from "./router.jsx";

// const API_URL = (window as any)["wingEnv"].API_URL as string;
// const API_URL = "https://platypus-ready-lightly.ngrok-free.app/wrpc";
const API_URL = new URL(location.origin);
API_URL.pathname = "/wrpc";
// API_URL.search = "";
console.log("API_URL", API_URL.toString());

export const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WRPCProvider value={{ url: API_URL.toString() }}>
        <RouterProvider router={router} />
      </WRPCProvider>
    </QueryClientProvider>
  );
};
