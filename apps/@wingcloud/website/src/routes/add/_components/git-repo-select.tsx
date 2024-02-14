import {
  LockClosedIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useContext, useMemo, useState } from "react";

import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { AppsDataProviderContext } from "../../../data-store/apps-data-provider.js";
import { Input } from "../../../design-system/input.js";
import { Select } from "../../../design-system/select.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { GithubIcon } from "../../../icons/github-icon.js";
import type { Installation, Repository } from "../../../utils/wrpc.js";

export interface GitRepoSelectProps {
  installationId?: string;
  setInstallationId: (installationId: string) => void;
  repositoryId: string;
  setRepositoryId: (repositoryId: string) => void;
  installations: Installation[];
  repos: Repository[];
  loading: boolean;
  disabled?: boolean;
}

export const GitRepoSelect = ({
  installationId,
  setInstallationId,
  repositoryId,
  setRepositoryId,
  installations,
  repos,
  loading,
  disabled,
}: GitRepoSelectProps) => {
  const { theme } = useTheme();

  const [search, setSearch] = useState("");
  const { apps } = useContext(AppsDataProviderContext);

  const installationPlaceholder = useMemo(() => {
    if (loading && installations.length === 0) {
      return "Loading...";
    }
    if (installations.length === 0) {
      return "No GitHub namespaces found";
    }
  }, [loading, installations.length]);

  const repoItems = useMemo(() => {
    return repos.map((repo) => {
      return {
        ...repo,
        used: apps.some((app) => app.repoId === repo.full_name),
      };
    });
  }, [repos, apps]);

  const filteredRepos = useMemo(() => {
    return repoItems.filter((repo) => {
      if (search === "") {
        return true;
      }
      return repo.full_name
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase());
    });
  }, [repoItems, search]);

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 w-full items-center">
        <div className="w-1/3">
          <Select
            items={installations.map((installation) => ({
              value: installation.id.toString(),
              label: installation.account.login,
            }))}
            placeholder={installationPlaceholder}
            onChange={setInstallationId}
            value={installationId ?? ""}
            className="w-full"
            disabled={installations.length === 0 || disabled}
            renderItem={(item) => {
              return (
                <div className="flex items-center gap-2">
                  <GithubIcon
                    className={clsx(
                      "w-4 h-4 inline-block shrink-0",
                      theme.text1,
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            }}
          />
        </div>

        <div className={clsx("text-xl", theme.text2)}>/</div>

        <div className="flex-grow">
          <Input
            type="text"
            leftIcon={MagnifyingGlassIcon}
            className="block w-full"
            containerClassName="w-full"
            name="search"
            id="search"
            placeholder="Search..."
            value={search}
            disabled={disabled}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      {!loading && filteredRepos.length === 0 && (
        <div
          className={clsx(
            "text-center flex justify-center w-full",
            "text-xs py-2",
            theme.text1,
          )}
        >
          No repos found.
        </div>
      )}

      <div className="h-40 md:h-80">
        {(filteredRepos.length > 0 || loading) && (
          <div
            className={clsx(
              "max-h-40 md:max-h-80 flex flex-col overflow-auto rounded-md",
              "border",
              theme.borderInput,
            )}
          >
            <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-md">
              {filteredRepos.map((repo) => (
                <div
                  aria-disabled={disabled || repo.used}
                  key={repo.id}
                  className={clsx(
                    theme.text1,
                    "text-xs px-4 py-4 gap-1",
                    "w-full text-left flex items-center",
                    "transition-all outline-none focus:outline-none",
                    "focus:bg-gray-50 dark:focus:bg-gray-750",
                    repositoryId === repo.full_name &&
                      "bg-gray-50 dark:bg-gray-750",
                    repositoryId !== repo.full_name && theme.bgInput,
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <img
                      className="w-6 h-6 shrink-0 rounded-full"
                      src={repo.owner.avatar_url}
                    />
                    <div className="flex gap-1 items-center truncate">
                      <div className="truncate">{repo.name}</div>
                      {repo.private && (
                        <LockClosedIcon className="w-3 h-3 shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-grow justify-end">
                    <button
                      className={clsx(
                        "rounded px-2 py-1 border text-xs",
                        theme.borderInput,
                        theme.textInput,
                        disabled || repo.used
                          ? "opacity-40"
                          : [theme.bgInputHover],
                      )}
                      onClick={() => {
                        setRepositoryId(repo.full_name);
                      }}
                      disabled={disabled || repo.used}
                    >
                      {repo.used ? "Connected" : "Connect"}
                    </button>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="p-4 w-full flex items-center justify-center relative">
                  <SpinnerLoader size="sm" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
