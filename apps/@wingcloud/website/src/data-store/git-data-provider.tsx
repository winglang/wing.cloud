import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";

import type { App, Installation, Repository } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

export interface GitDataProviderContext {
  installationId?: string;
  setInstallationId: (id: string) => void;
  installations: Installation[];
  repos: Repository[];
  isLoading: boolean;
  isError: boolean;
  refetchInstallations: () => Promise<any>;
  refetchRepos: () => Promise<any>;
}
const DEFAULT_CONTEXT: GitDataProviderContext = {
  installationId: undefined,
  setInstallationId: () => {},
  installations: [],
  repos: [],
  isLoading: true,
  isError: false,
  refetchInstallations: () => {
    return Promise.resolve();
  },
  refetchRepos: () => {
    return Promise.resolve();
  },
};
export const GitDataProviderContext =
  createContext<GitDataProviderContext>(DEFAULT_CONTEXT);

export const GitDataProvider = ({ children }: PropsWithChildren) => {
  const [installationId, setInstallationId] = useState<string>();

  const [installations, setInstallations] = useState<Installation[]>([]);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  const user = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });

  const listInstallationsQuery =
    wrpc["github.listInstallations"].useInfiniteQuery();

  useEffect(() => {
    if (!listInstallationsQuery.data?.pages) {
      return;
    }
    listInstallationsQuery.fetchNextPage();
    setInstallations(
      listInstallationsQuery.data.pages.flatMap((page) => page.data),
    );
  }, [listInstallationsQuery.data]);

  const listReposQuery = wrpc["github.listRepositories"].useInfiniteQuery({
    installationId: installationId!,
  });

  useEffect(() => {
    if (!listReposQuery.data?.pages) {
      return;
    }
    listReposQuery.fetchNextPage();
    setRepos(listReposQuery.data.pages.flatMap((page) => page.data));
  }, [listReposQuery.data]);

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

  useEffect(() => {
    // Preveent turning off loading state if refetching
    if (listInstallationsQuery.isRefetching || listReposQuery.isRefetching) {
      return;
    }

    setLoading(listInstallationsQuery.isLoading || listReposQuery.isLoading);
  }, [listInstallationsQuery, listReposQuery]);

  return (
    <GitDataProviderContext.Provider
      value={{
        installations,
        installationId,
        setInstallationId,
        repos,
        isLoading: loading,
        isError: listInstallationsQuery.isError || listReposQuery.isError,
        refetchInstallations: () => {
          setLoading(true);
          setRepos([]);
          return listInstallationsQuery.refetch();
        },
        refetchRepos: () => {
          return listReposQuery.refetch();
        },
      }}
    >
      {children}
    </GitDataProviderContext.Provider>
  );
};
