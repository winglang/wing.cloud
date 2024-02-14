import { createContext, type PropsWithChildren } from "react";

import type { App, User } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

export interface AuthDataProviderContext {
  user?: User;
  error?: Error;
}
const DEFAULT_CONTEXT: AuthDataProviderContext = {
  user: undefined,
  error: undefined,
};
export const AuthDataProviderContext =
  createContext<AuthDataProviderContext>(DEFAULT_CONTEXT);

export const AuthDataProvider = ({ children }: PropsWithChildren) => {
  const user = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
    refetchInterval: 1000 * 60 * 15,
  });

  return (
    <AuthDataProviderContext.Provider
      value={{
        user: user.data?.user,
        error: user.error ?? undefined,
      }}
    >
      {children}
    </AuthDataProviderContext.Provider>
  );
};
