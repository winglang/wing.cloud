import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
} from "react";

import { AnalyticsContext } from "./analytics-provider.js";
import { wrpc } from "./wrpc.js";

export interface AnalyticsIdentityContext {}
export const AnalyticsIdentityContext = createContext<AnalyticsIdentityContext>(
  {},
);
export const AnalyticsIdentityProvider = ({ children }: PropsWithChildren) => {
  const { setIdentity } = useContext(AnalyticsContext);
  const { data: queryData } = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });

  useEffect(() => {
    if (queryData?.user) {
      setIdentity({
        name: queryData.user.username,
        email: queryData.user.email,
        id: queryData.user.id,
      });
    }
  }, [queryData]);

  return (
    <AnalyticsIdentityContext.Provider value={{}}>
      {children}
    </AnalyticsIdentityContext.Provider>
  );
};
