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

  const createAppMutation = wrpc["user.createApp"].useMutation();

  const createApp = useCallback(async () => {
    const repos = listReposQuery.data?.repositories;
    if (!repos) {
      return;
    }
    const repo = repos.find(
      (repo) => repo.full_name.toString() === repositoryId,
    );
    if (!repo || !installationId) {
      return;
    }

    setCreateAppLoading(true);
    setRepositoryId(repo.full_name.toString());
    const response = await createAppMutation.mutateAsync(
      {
        appName: repo.name,
        description: repo.description ?? "",
        repoId: repo.full_name.toString(),
        repoName: repo.name,
        repoOwner: repo.owner.login,
        entryfile: "main.w",
        default_branch: repo.default_branch,
        imageUrl: repo.owner.avatar_url,
        installationId: installationId,
      },
      {
        onError: (error) => {
          setCreateAppLoading(false);
          throw error;
        },
      },
    );
    setCreateAppLoading(false);
    return {
      appId: response.appId,
      appName: repo.name,
    };
  }, [createAppMutation, installationId, listReposQuery.data, repositoryId]);

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

  return {
    createApp,
    installationId,
    setInstallationId,
    repositoryId,
    setRepositoryId,
    createAppLoading,
    listReposQuery,
    listInstallationsQuery,
  };
};
