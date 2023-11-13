import clsx from "clsx";

import { useTheme } from "../design-system/theme-provider.js";
import { type Installation, type Repository } from "../utils/wrpc.js";

import { GitRepoSelect } from "./git-repo-select.js";
import { MissingRepoButton } from "./missing-repo-button.js";

export interface ConnectRepoSettingsProps {
  installations: Installation[];
  repos: Repository[];
  installationId?: string;
  setInstallationId: (installationId: string) => void;
  repositoryId?: string;
  setRepositoryId: (repositoryId: string) => void;
  onRepoListChange?: () => void;
  loading?: boolean;
}

export const ConnectRepoSettings = ({
  installations,
  repos,
  installationId,
  setInstallationId,
  repositoryId,
  setRepositoryId,
  onRepoListChange,
  loading = false,
}: ConnectRepoSettingsProps) => {
  const { theme } = useTheme();

  return (
    <div className="w-full space-y-2">
      <div className={clsx(theme.text2)}>Select a Git Repository</div>

      <GitRepoSelect
        installationId={installationId}
        setInstallationId={setInstallationId}
        repositoryId={repositoryId}
        setRepositoryId={setRepositoryId}
        installations={installations}
        repos={repos}
        loading={loading}
      />
      <MissingRepoButton
        onClose={() => {
          onRepoListChange?.();
        }}
      />
    </div>
  );
};
