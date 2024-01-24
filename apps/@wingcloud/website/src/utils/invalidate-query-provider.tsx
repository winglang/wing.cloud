import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type PropsWithChildren,
} from "react";

import { wrpc } from "./wrpc.js";

const InvalidateQueryContext = createContext<WebSocket | undefined>(undefined);

export const InvalidateQueryProvider = ({ children }: PropsWithChildren) => {
  const auth = wrpc["ws.auth"].useQuery();
  const queryClient = useQueryClient();

  const ws = wrpc["app.invalidateQuery"].useSubscription(undefined, {
    async onData(data) {
      console.log("app.invalidateQuery", data);
      if (data.query) {
        await queryClient.invalidateQueries({ queryKey: [data.query] });
      } else {
        console.log("Invalidate all queries");
        //queryClient.invalidateQueries();
      }
    },
  });

  const authorize = useCallback(() => {
    console.log("Authorize", auth.data?.token);
    ws.send(
      JSON.stringify({
        type: "authorize",
        subscriptionId: "app.invalidateQuery",
        payload: auth.data?.token,
      }),
    );
  }, [auth.data?.token, ws]);

  useEffect(() => {
    if (ws.readyState === WebSocket.OPEN) {
      authorize();
    } else {
      ws.addEventListener("open", () => {
        authorize();
      });
    }

    return () => {
      ws.removeEventListener("open", authorize);
    };
  }, [auth.data?.token, ws, authorize]);

  useEffect(() => {
    return () => {
      ws.close();
    };
  }, []);

  return (
    <InvalidateQueryContext.Provider value={ws}>
      {children}
    </InvalidateQueryContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(InvalidateQueryContext);
};
