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

  useEffect(() => {
    const installations = listInstallationsQuery.data?.pages?.flatMap(
      (page) => page.data,
    );
    if (!installations || installations.length === 0) {
      return;
    }
    const mainInstallation = installations.find(
      (installation) => installation.account.login === user.data?.user.username,
    );
    if (mainInstallation) {
      setInstallationId(mainInstallation.id.toString());
      return;
    }
    const firstInstallationId = installations[0]?.id.toString();
    if (firstInstallationId) {
      setInstallationId(firstInstallationId);
    }
  }, [listInstallationsQuery.data, user.data]);

  useEffect(() => {
    if (!listReposQuery.data?.pages) {
      return;
    }
    listReposQuery.fetchNextPage();
  }, [listReposQuery.data]);

  // If installation id was changed, refetch repos. Needed in case the user didn't have access to any repo before.
  useEffect(() => {
    if (installationId) {
      listReposQuery.refetch();
    }
  }, [installationId]);

  return (
    <GitDataProviderContext.Provider
      value={{
        installations,
        installationId,
        setInstallationId,
        repos,
        isLoading: listInstallationsQuery.isLoading || listReposQuery.isLoading,
        isError: listInstallationsQuery.isError || listReposQuery.isError,
        refetchInstallations: listInstallationsQuery.refetch,
        refetchRepos: listReposQuery.refetch,
      }}
    >
      {children}
    </GitDataProviderContext.Provider>
  );
};
