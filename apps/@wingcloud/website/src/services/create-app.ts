import { useCallback, useEffect, useMemo, useState } from "react";

import { wrpc } from "../utils/wrpc.js";

export const useCreateAppFromRepo = () => {
  const [createAppLoading, setCreateAppLoading] = useState(false);
  const [repositoryId, setRepositoryId] = useState<string>();
  const [installationId, setInstallationId] = useState<string>();

  const listInstallationsQuery = wrpc["github.listInstallations"].useQuery();

  const listReposQuery = wrpc["github.listRepositories"].useQuery(
    {
      installationId: installationId!,
    },
    {
      enabled: installationId != undefined,
    },
  );

  const createAppMutation = wrpc["app.create"].useMutation();

  const createApp = useCallback(
    async ({
      owner,
      appName,
      description = "",
      repoName,
      repoOwner,
      entryfile = "main.w",
      defaultBranch,
      installationId,
    }: {
      owner: string;
      appName: string;
      description?: string;
      repoName: string;
      repoOwner: string;
      entryfile: string;
      defaultBranch: string;
      installationId: string;
    }) => {
      setCreateAppLoading(true);
      const response = await createAppMutation.mutateAsync(
        {
          owner,
          appName,
          description,
          repoName,
          repoOwner,
          entryfile,
          defaultBranch,
          installationId,
        },
        {
          onError: (error) => {
            setCreateAppLoading(false);
            throw error;
          },
        },
      );
      setCreateAppLoading(false);
      return response;
    },
    [createAppMutation, installationId, listReposQuery.data, repositoryId],
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

  const disabled = useMemo(() => {
    return !installationId || !repositoryId;
  }, [installationId, repositoryId]);

  const loading = useMemo(() => {
    return listInstallationsQuery.isLoading || listReposQuery.isLoading;
  }, [listInstallationsQuery.isLoading, listReposQuery.isLoading]);

  return {
    createApp,
    installationId,
    setInstallationId,
    repositoryId,
    setRepositoryId,
    createAppLoading,
    loading,
    disabled,
    listReposQuery,
    listInstallationsQuery,
  };
};
