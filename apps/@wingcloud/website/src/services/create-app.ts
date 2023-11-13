import { useCallback, useEffect, useMemo, useState } from "react";

import { wrpc } from "../utils/wrpc.js";

export type ConfigurationType = "connect";

export const useCreateAppFromRepo = () => {
  const [createAppLoading, setCreateAppLoading] = useState(false);
  const [repositoryId, setRepositoryId] = useState<string>();
  const [installationId, setInstallationId] = useState<string>();

  const createAppMutation = wrpc["user.createApp"].useMutation();

  const createApp = useCallback(async () => {
    const repo = repos.find(
      (repo) => repo.full_name.toString() === repositoryId,
    );
    if (!repo || !installationId) {
      return;
    }

    setCreateAppLoading(true);
    setRepositoryId(repo.full_name.toString());
    await createAppMutation.mutateAsync(
      {
        appName: repo.name,
        description: repo.description,
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
  }, [createAppMutation]);

  const installationsQuery = wrpc["github.listInstallations"].useQuery();

  const installations = useMemo(() => {
    if (!installationsQuery.data) {
      return [];
    }
    return installationsQuery.data.installations;
  }, [installationsQuery.data]);

  const listReposQuery = wrpc["github.listRepositories"].useQuery(
    {
      installationId: installationId!,
    },
    {
      enabled: installationId != undefined,
    },
  );

  const repos = useMemo(() => {
    if (!listReposQuery.data) {
      return [];
    }
    return listReposQuery.data.repositories;
  }, [listReposQuery.data]);

  useEffect(() => {
    const firstInstallationId = installations[0]?.id.toString();
    if (firstInstallationId) {
      setInstallationId(firstInstallationId);
    }
  }, [installationsQuery.data]);

  useEffect(() => {
    setRepositoryId("");
  }, [installationId]);

  const disabled = useMemo(() => {
    return !installationId || !repositoryId;
  }, [installationId, repositoryId]);

  return {
    createApp,
    installations,
    repos,
    installationId,
    setInstallationId,
    repositoryId,
    setRepositoryId,
    createAppLoading,
    loadingRepositories: listReposQuery.isLoading,
    disabled,
  };
};
