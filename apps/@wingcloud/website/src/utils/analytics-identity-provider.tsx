import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
} from "react";

import { AuthDataProviderContext } from "../data-store/auth-data-provider.js";

import { AnalyticsContext } from "./analytics-provider.js";

export interface AnalyticsIdentityContext {}
export const AnalyticsIdentityContext = createContext<AnalyticsIdentityContext>(
  {},
);
export const AnalyticsIdentityProvider = ({ children }: PropsWithChildren) => {
  const { setIdentity } = useContext(AnalyticsContext);
  const { user } = useContext(AuthDataProviderContext);

  useEffect(() => {
    if (user) {
      setIdentity({
        name: user.username,
        email: user.email,
        id: user.id,
      });
    }
  }, [user]);

  return (
    <AnalyticsIdentityContext.Provider value={{}}>
      {children}
    </AnalyticsIdentityContext.Provider>
  );
};
