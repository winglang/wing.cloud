import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
  useContext,
} from "react";

import type { Installation } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

import { AuthDataProviderContext } from "./auth-data-provider.js";

export interface InstallationsDataProviderContext {
  installationId?: string;
  setInstallationId: (id: string) => void;
  installations: Installation[];
  isLoading: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}
const DEFAULT_CONTEXT: InstallationsDataProviderContext = {
  installationId: undefined,
  setInstallationId: () => {},
  installations: [],
  isLoading: true,
  isFetching: false,
  isRefetching: false,
  isError: false,
  refetch: () => {
    return Promise.resolve();
  },
};

export const InstallationsDataProviderContext =
  createContext<InstallationsDataProviderContext>(DEFAULT_CONTEXT);

export const InstallationsDataProvider = ({ children }: PropsWithChildren) => {
  const [installationId, setInstallationId] = useState<string>();

  const [installations, setInstallations] = useState<Installation[]>([]);

  const { user } = useContext(AuthDataProviderContext);

  const listInstallationsQuery =
    wrpc["github.listInstallations"].useInfiniteQuery();

  // TODO: Add a "load more" button to fetch more installations
  useEffect(() => {
    if (!listInstallationsQuery.data?.pages) {
      return;
    }
    listInstallationsQuery.fetchNextPage();
    setInstallations(
      listInstallationsQuery.data.pages.flatMap((page) => page.data),
    );
  }, [listInstallationsQuery.data]);

  // Set the default installation id after fetching installations
  useEffect(() => {
    const installations = listInstallationsQuery.data?.pages?.flatMap(
      (page) => page.data,
    );
    if (!installations || installations.length === 0) {
      return;
    }
    const defaultInstallationId = installations.find(
      (installation) => installation.account.login === user?.username,
    );
    if (defaultInstallationId) {
      setInstallationId(defaultInstallationId.id.toString());
      return;
    }
    const firstInstallationId = installations[0]?.id.toString();
    if (firstInstallationId) {
      setInstallationId(firstInstallationId);
    }
  }, [listInstallationsQuery.data, user]);

  return (
    <InstallationsDataProviderContext.Provider
      value={{
        installations,
        installationId,
        setInstallationId,
        isLoading: listInstallationsQuery.isLoading,
        isFetching: listInstallationsQuery.isFetching,
        isRefetching: listInstallationsQuery.isRefetching,
        isError: listInstallationsQuery.isError,
        refetch: async () => {
          await listInstallationsQuery.refetch();
        },
      }}
    >
      {children}
    </InstallationsDataProviderContext.Provider>
  );
};
