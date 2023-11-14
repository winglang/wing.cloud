import {
  LockClosedIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";

import { SpinnerLoader } from "../../../components/spinner-loader.js";
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

  const installationPlaceholder = useMemo(() => {
    if (loading) {
      return "Loading...";
    }
    if (installations.length === 0) {
      return "No GitHub namespaces found";
    }
    return "Select a GitHub namespace";
  }, [loading, installations.length]);

  const searchPlaceholder = useMemo(() => {
    return repositoryId ? repositoryId.split("/")[1] : "Search...";
  }, [repositoryId]);

  const filteredRepos = useMemo(() => {
    return repos.filter((repo) => {
      if (search === "") {
        return true;
      }
      return repo.full_name
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase());
    });
  }, [repos, search]);

  return (
    <div className="w-full space-y-2">
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
            disabled={loading || disabled}
            renderItem={(item) => {
              return (
                <div className="flex items-center gap-2">
                  <GithubIcon
                    className={clsx("w-4 h-4 inline-block", theme.text1)}
                  />
                  {item.label}
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
            placeholder={searchPlaceholder}
            value={search}
            disabled={loading || disabled}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      {loading && (
        <div className="bg-white p-6 w-full flex items-center justify-center">
          <SpinnerLoader size="sm" />
        </div>
      )}
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
      {!loading && filteredRepos.length > 0 && (
        <div
          className={clsx(
            "flex flex-col max-h-80 overflow-auto rounded",
            "border divide-y",
            theme.borderInput,
          )}
        >
          {filteredRepos.map((repo) => (
            <div
              aria-disabled={disabled}
              key={repo.id}
              className={clsx(
                theme.text1,
                "text-xs px-2.5 py-2 gap-1",
                "w-full text-left flex items-center",
                "transition-all outline-none focus:outline-none",
                "focus:bg-slate-50 dark:focus:bg-slate-750",
                repositoryId === repo.full_name &&
                  "bg-slate-50 dark:bg-slate-750",
                repositoryId !== repo.full_name && theme.bgInput,
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && theme.bgInputHover,
              )}
            >
              <div className="flex items-center gap-2">
                <img className="w-4 h-4" src={repo.owner.avatar_url} />
                <div className="flex gap-1 items-center">
                  <div>{repo.name}</div>
                  {repo.private && <LockClosedIcon className="w-3 h-3" />}
                </div>
              </div>
              <div className="flex flex-grow justify-end">
                <button
                  className={clsx(
                    "rounded px-1 py-0.5 border text-xs",
                    theme.borderInput,
                    theme.bgInputHover,
                    theme.textInput,
                  )}
                  onClick={() => {
                    setRepositoryId(repo.full_name);
                  }}
                  disabled={disabled}
                >
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
