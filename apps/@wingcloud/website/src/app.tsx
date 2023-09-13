import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";

import { GithubLogin } from "./components/github-login.js";
import { Message } from "./components/message.js";
import { trpc } from "./utils/trpc.js";

export const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/trpc",
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div className="p-6">
          <GithubLogin />
          <div className="py-4">
            <Message />
          </div>
        </div>
      </QueryClientProvider>
    </trpc.Provider>
  );
};
