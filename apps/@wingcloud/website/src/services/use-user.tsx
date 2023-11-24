import type { PropsWithChildren } from "react";
import { useContext } from "react";
import { useState } from "react";
import { createContext } from "react";

import { wrpc } from "../utils/wrpc.js";

export interface User {
  id: string;
  username: string;
}

export interface UserProviderProps {
  user?: User;
}

const UserContext = createContext<UserProviderProps>({
  user: { id: "", username: "" },
});

export const UserProvider = ({
  children,
}: PropsWithChildren<UserProviderProps>) => {
  const [user, setUser] = useState<User>();

  try {
    const authCheck = wrpc["auth.check"].useQuery(undefined, {
      throwOnError: true,
      retry: false,
      enabled: location.pathname !== "/",
    });
    console.log(authCheck.data);
    if (authCheck?.data && !user) {
      setUser({
        id: authCheck.data.userId,
        username: authCheck.data.username,
      });
    }
  } catch (error) {
    console.log(error);
    window.location.href = "/";
  }

  return (
    <UserContext.Provider
      value={{
        user: user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
