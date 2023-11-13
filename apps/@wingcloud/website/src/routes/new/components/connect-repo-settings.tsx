import clsx from "clsx";
import { useCallback } from "react";

import { useTheme } from "../../../design-system/theme-provider.js";
import { useCreateAppFromRepo } from "../../../services/create-app.js";

import { CreateAppFooter } from "./create-app-footer.js";
import { GitRepoSelect } from "./git-repo-select.js";
import { MissingRepoButton } from "./missing-repo-button.js";

export interface ConnectRepoSettingsProps {
  onCreateApp: () => void;
  onCancel: () => void;
  onError: (error: Error) => void;
}

export const ConnectRepoSettings = ({
  onCreateApp,
  onCancel,
  onError,
}: ConnectRepoSettingsProps) => {
  const { theme } = useTheme();

  const {
    createApp,
    installations,
    repos,
    installationId,
    setInstallationId,
    repositoryId,
    setRepositoryId,
    loadingRepositories,
    createAppLoading,
  } = useCreateAppFromRepo();

  const onCreate = useCallback(async () => {
    try {
      await createApp();
      onCreateApp();
    } catch (error) {
      if (error instanceof Error) {
        onError(error);
      }
    }
  }, [createApp, onCreateApp, onError]);

  return (
    <div className="w-full space-y-4">
      <div className={clsx(theme.text1)}>Select a Git Repository</div>
      <GitRepoSelect
        installationId={installationId}
        setInstallationId={setInstallationId}
        repositoryId={repositoryId || ""}
        setRepositoryId={setRepositoryId}
        installations={installations}
        repos={repos}
        loading={loadingRepositories}
      />
      <MissingRepoButton
        onClose={() => {
          setInstallationId("");
        }}
      />
      <CreateAppFooter
        onCancel={onCancel}
        onCreate={onCreate}
        disabled={!repositoryId}
        loading={createAppLoading}
      />
    </div>
  );
};
