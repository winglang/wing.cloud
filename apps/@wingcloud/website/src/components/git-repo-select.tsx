import { LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";

import { Combobox } from "../design-system/combobox.js";
import { Select } from "../design-system/select.js";
import { useTheme } from "../design-system/theme-provider.js";
import type { Installation, Repository } from "../utils/wrpc.js";

export interface GitRepoSelectProps {
  installationId?: string;
  setInstallationId: (installationId: string) => void;
  repositoryId: string;
  setRepositoryId: (repositoryId: string) => void;
  installations: Installation[];
  repos: Repository[];
  loading: boolean;
}

export const GitRepoSelect = ({
  installationId,
  setInstallationId,
  repositoryId,
  setRepositoryId,
  installations,
  repos,
  loading,
}: GitRepoSelectProps) => {
  const { theme } = useTheme();

  const selectRepoPlaceholder = useMemo(() => {
    if (loading) {
      return "Loading...";
    }
    if (repos.length === 0) {
      return "No repositories found";
    }
    return "Select a repository";
  }, [loading, repos.length]);

  return (
    <div className="flex gap-2 w-full items-center">
      <div className="w-1/3">
        <Select
          items={installations.map((installation) => ({
            value: installation.id.toString(),
            label: installation.account.login,
          }))}
          placeholder="Select a GitHub namespace"
          onChange={setInstallationId}
          value={installationId ?? ""}
          className="w-full"
        />
      </div>

      <div className={clsx("text-xl", theme.text2)}>/</div>

      <div className="flex-grow">
        <Combobox
          items={
            repos.map((repo) => ({
              value: repo.full_name.toString(),
              label: repo.name,
            })) ?? []
          }
          value={repositoryId}
          placeholder={selectRepoPlaceholder}
          onChange={setRepositoryId}
          disabled={repos.length === 0 || loading}
          renderItem={(item) => {
            const repo = repos.find(
              (repo) => repo.full_name.toString() === item.value,
            );
            return (
              <div className="flex items-center">
                <img
                  src={repo?.owner.avatar_url}
                  className="w-5 h-5 inline-block mr-2 rounded-full"
                />
                <span>{item.label}</span>
                <div className="mx-1 items-center">
                  {repo?.private && (
                    <LockClosedIcon className="w-3 h-3 inline-block text-slate-600" />
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};
