import { useQueryClient } from "@tanstack/react-query";
import { type PropsWithChildren, useEffect } from "react";

import { wrpc } from "./wrpc.js";

export const QueryInvalidation = ({ children }: PropsWithChildren) => {
  const auth = wrpc["ws.auth"].useQuery(undefined, {
    retry: false,
  });

  const queryClient = useQueryClient();
  const ws = wrpc["app.invalidateQuery"].useSubscription(undefined, {
    async onData(data) {
      console.log("app.invalidateQuery", data);
      if (data.query) {
        await queryClient.invalidateQueries({ queryKey: [data.query] });
      } else {
        queryClient.invalidateQueries();
      }
    },
  });

  useEffect(() => {
    if (!auth.data?.token) {
      return;
    }
    ws.auth(auth.data?.token);
  }, [auth.data]);

  useEffect(() => {
    return () => {
      ws.close();
    };
  }, []);

  return children;
};
