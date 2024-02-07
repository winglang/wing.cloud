import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";

import type { App, Installation, Repository } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

export interface InstallationsDataProviderContext {
  installationId?: string;
  setInstallationId: (id: string) => void;
  installations: Installation[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}
const DEFAULT_CONTEXT: InstallationsDataProviderContext = {
  installationId: undefined,
  setInstallationId: () => {},
  installations: [],
  isLoading: true,
  isFetching: false,
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

  const user = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });

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
      (installation) => installation.account.login === user.data?.user.username,
    );
    if (defaultInstallationId) {
      setInstallationId(defaultInstallationId.id.toString());
      return;
    }
    const firstInstallationId = installations[0]?.id.toString();
    if (firstInstallationId) {
      setInstallationId(firstInstallationId);
    }
  }, [listInstallationsQuery.data, user.data]);

  return (
    <InstallationsDataProviderContext.Provider
      value={{
        installations,
        installationId,
        setInstallationId,
        isLoading: listInstallationsQuery.isLoading,
        isFetching: listInstallationsQuery.isRefetching,
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
