import { useCallback, useEffect, useMemo, useState } from "react";

import { wrpc } from "../utils/wrpc.js";

export const useCreateAppFromRepo = () => {
  const [createAppLoading, setCreateAppLoading] = useState(false);
  const [repositoryId, setRepositoryId] = useState<string>();
  const [installationId, setInstallationId] = useState<string>();

  const listInstallationsQuery = wrpc["github.listInstallations"].useQuery();

  const listReposQuery = wrpc["github.listRepositories"].useInfiniteQuery({
    installationId: installationId!,
    page: 1,
  });

  useEffect(() => {
    if (!listReposQuery.data?.pages) {
      return;
    }
    listReposQuery.fetchNextPage();
  }, [listReposQuery.data]);

  const createAppMutation = wrpc["app.create"].useMutation();

  const createApp = useCallback(
    async (params: {
      owner: string;
      appName: string;
      description: string;
      repoName: string;
      repoOwner: string;
      defaultBranch: string;
      installationId: string;
    }) => {
      setCreateAppLoading(true);
      const response = await createAppMutation.mutateAsync(params, {
        onError: (error) => {
          setCreateAppLoading(false);
          throw error;
        },
      });
      setCreateAppLoading(false);
      return response;
    },
    [createAppMutation],
  );

  useEffect(() => {
    const installations = listInstallationsQuery.data?.installations;
    if (!installations || installations.length === 0) {
      return;
    }
    const firstInstallationId = installations[0]?.id.toString();
    if (firstInstallationId) {
      setInstallationId(firstInstallationId);
    }
  }, [listInstallationsQuery.data]);

  useEffect(() => {
    setRepositoryId("");
  }, [installationId]);

  const loading = useMemo(() => {
    return (
      listInstallationsQuery.isLoading ||
      listReposQuery.isLoading ||
      listReposQuery.isFetching ||
      listInstallationsQuery.isFetching
    );
  }, [listInstallationsQuery, listReposQuery]);

  return {
    createApp,
    installationId,
    setInstallationId,
    repositoryId,
    setRepositoryId,
    createAppLoading,
    loading,
    listReposQuery,
    listInstallationsQuery,
  };
};
