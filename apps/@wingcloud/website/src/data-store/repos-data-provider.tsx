import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
  useContext,
} from "react";

import type { Repository } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

import { InstallationsDataProviderContext } from "./installations-data-provider.js";

export interface ReposDataProviderContext {
  repos: Repository[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}
const DEFAULT_CONTEXT: ReposDataProviderContext = {
  repos: [],
  isLoading: true,
  isError: false,
  isFetching: false,
  refetch: () => {
    return Promise.resolve();
  },
};
export const ReposDataProviderContext =
  createContext<ReposDataProviderContext>(DEFAULT_CONTEXT);

const InternalReposDataProvider = ({
  installationId,
  children,
}: PropsWithChildren<{
  installationId: string;
}>) => {
  const [repos, setRepos] = useState<Repository[]>([]);

  const listReposQuery = wrpc["github.listRepositories"].useInfiniteQuery({
    installationId,
  });

  // TODO: Add a "load more" button to fetch more repos
  useEffect(() => {
    if (!listReposQuery.data?.pages) {
      return;
    }
    listReposQuery.fetchNextPage();
    setRepos(listReposQuery.data.pages.flatMap((page) => page.data));
  }, [listReposQuery.data]);

  useEffect(() => {
    if (!installationId) {
      return;
    }
    const repos = listReposQuery.data?.pages.flatMap((page) => page.data);

    // clean up repos if installationId changes and no repos are found for the new installationId
    if (!repos) {
      setRepos([]);
    }
  }, [installationId, listReposQuery.data]);

  return (
    <ReposDataProviderContext.Provider
      value={{
        repos,
        isLoading: listReposQuery.isLoading,
        isFetching: listReposQuery.isRefetching,
        isError: listReposQuery.isError,
        refetch: async () => {
          await listReposQuery.refetch();
        },
      }}
    >
      {children}
    </ReposDataProviderContext.Provider>
  );
};

export const ReposDataProvider = ({ children }: PropsWithChildren) => {
  const { installationId, setInstallationId } = useContext(
    InstallationsDataProviderContext,
  );
  if (!setInstallationId) {
    throw new Error(
      "ReposDataProvider must be used within InstallationsDataProvider",
    );
  }

  return (
    <>
      {installationId && (
        <InternalReposDataProvider installationId={installationId}>
          {children}
        </InternalReposDataProvider>
      )}
      {!installationId && children}
    </>
  );
};
