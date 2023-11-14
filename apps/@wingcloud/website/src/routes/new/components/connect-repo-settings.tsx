import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTheme } from "../../../design-system/theme-provider.js";
import { useCreateAppFromRepo } from "../../../services/create-app.js";
import type { Installation } from "../../../utils/wrpc.js";

import { CreateAppFooter } from "./create-app-footer.js";
import { GitRepoSelect } from "./git-repo-select.js";
import { MissingRepoButton } from "./missing-repo-button.js";

export interface ConnectRepoSettingsProps {
  onAppCreated: () => void;
  onCancel: () => void;
  onError: (error: Error) => void;
}

export const ConnectRepoSettings = ({
  onAppCreated,
  onCancel,
  onError,
}: ConnectRepoSettingsProps) => {
  const { theme } = useTheme();

  const {
    createApp,
    listInstallationsQuery,
    listReposQuery,
    installationId,
    setInstallationId,
    repositoryId,
    setRepositoryId,
    loading,
    createAppLoading,
  } = useCreateAppFromRepo();

  const [installations, setInstallations] = useState<Installation[]>([]);

  useEffect(() => {
    if (!listInstallationsQuery.data) {
      return;
    }
    setInstallations(listInstallationsQuery.data.installations);
  }, [listInstallationsQuery.data]);

  const repos = useMemo(() => {
    if (!listReposQuery.data || installationId === "") {
      return [];
    }
    return listReposQuery.data.repositories;
  }, [listReposQuery.data]);

  const onCreate = useCallback(async () => {
    try {
      await createApp();
      onAppCreated();
    } catch (error) {
      if (error instanceof Error) {
        onError(error);
      }
    }
  }, [createApp, onAppCreated, onError]);

  const onMissingRepoClosed = useCallback(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    setInstallationId(undefined);
    setInstallations([]);
    // eslint-disable-next-line unicorn/no-useless-undefined
    setRepositoryId(undefined);
    listInstallationsQuery.refetch();
  }, [listInstallationsQuery.refetch, setInstallationId, setRepositoryId]);

  return (
    <div className="w-full space-y-2">
      <div className={clsx(theme.text1)}>Select a Git Repository</div>
      <GitRepoSelect
        installationId={installationId}
        setInstallationId={setInstallationId}
        repositoryId={repositoryId || ""}
        setRepositoryId={setRepositoryId}
        installations={installations}
        repos={repos}
        loading={loading}
      />
      <MissingRepoButton onClose={onMissingRepoClosed} />
      <CreateAppFooter
        onCancel={onCancel}
        onCreate={onCreate}
        disabled={!repositoryId}
        loading={createAppLoading}
      />
    </div>
  );
};
