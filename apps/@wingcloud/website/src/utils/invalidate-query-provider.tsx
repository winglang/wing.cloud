import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { wrpc } from "./wrpc.js";

const InvalidateQueryContext = createContext<WebSocket | undefined>(undefined);

export const InvalidateQueryProvider = ({
  url,
  children,
}: PropsWithChildren<{ url: string }>) => {
  const queryClient = useQueryClient();
  const auth = wrpc["ws.invalidateQuery.auth"].useQuery();

  const [ws, setWs] = useState<WebSocket | undefined>(undefined);

  const onMessage = useCallback(
    (event: MessageEvent) => {
      console.debug("ws onMessage", event.data);

      const data = JSON.parse(event.data);
      if (data.query) {
        queryClient.invalidateQueries({ queryKey: [data.query] });
      }
    },
    [queryClient, auth.data?.subscriptionId],
  );

  useEffect(() => {
    if (!auth.data?.token || ws) {
      return;
    }
    const websocket = new WebSocket(url);
    websocket.addEventListener("open", () => {
      console.debug("ws opened");
      websocket.send(
        JSON.stringify({
          type: "authorize",
          subscriptionId: auth.data?.subscriptionId,
          payload: auth.data?.token,
        }),
      );
    });
    websocket.addEventListener("message", onMessage);
    setWs(websocket);
  }, [auth.data?.token, auth.data?.subscriptionId, onMessage, url, ws]);

  useEffect(() => {
    if (!ws) {
      return;
    }
    return () => {
      ws.removeEventListener("message", onMessage);
      ws.close();
    };
  }, [ws]);

  return (
    <InvalidateQueryContext.Provider value={ws}>
      {children}
    </InvalidateQueryContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(InvalidateQueryContext);
};
