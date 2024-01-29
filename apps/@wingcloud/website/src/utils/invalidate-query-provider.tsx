import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
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

  useEffect(() => {
    // there is no need to re-create the websocket
    if (ws) {
      return;
    }
    // can't create the websocket without the token and subscriptionId
    if (!auth.data?.token || !auth.data?.subscriptionId) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      console.debug("ws message", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.query) {
          queryClient.invalidateQueries({ queryKey: [data.query] });
        }
      } catch {
        console.debug("WS message is not a valid JSON");
      }
    };

    const onOpen = () => {
      console.debug("ws opened");
      websocket.send(
        JSON.stringify({
          type: "authorize",
          subscriptionId: auth.data?.subscriptionId,
          payload: auth.data?.token,
        }),
      );
    };

    console.debug("ws connecting to", url);
    const websocket = new WebSocket(url);
    websocket.addEventListener("open", onOpen);
    websocket.addEventListener("message", onMessage);
    setWs(websocket);

    return () => {
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        return;
      }
      websocket.removeEventListener("open", onOpen);
      websocket.removeEventListener("message", onMessage);
      websocket.close();
      setWs(undefined);
      console.debug("ws closed");
    };
  }, [auth.data, url, ws]);

  return (
    <InvalidateQueryContext.Provider value={ws}>
      {children}
    </InvalidateQueryContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(InvalidateQueryContext);
};
