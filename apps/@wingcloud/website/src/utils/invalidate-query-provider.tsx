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
  const auth = wrpc["ws.auth"].useQuery();

  const [ws, setWs] = useState<WebSocket | undefined>(undefined);

  const onMessage = useCallback(
    (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.debug("app.invalidateQuery", data);
      if (data.type === "invalidateQuery") {
        if (data.query) {
          queryClient.invalidateQueries({ queryKey: [data.query] });
        } else {
          queryClient.invalidateQueries();
        }
      }
    },
    [queryClient],
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
          subscriptionId: "app.invalidateQuery",
          payload: auth.data?.token,
        }),
      );
    });
    websocket.addEventListener("message", onMessage);
    setWs(websocket);
  }, [auth.data?.token, onMessage, url]);

  useEffect(() => {
    return () => {
      if (!ws) {
        return;
      }
      ws.addEventListener("message", onMessage);
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
