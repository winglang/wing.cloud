import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";

import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { StatusDot } from "../../../components/status-dot.js";
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

  const filteredRepos = useMemo(() => {
    return repos.filter((repo) => {
      if (search === "") {
        return true;
      }
      return repo.full_name.includes(search);
    });
  }, [repos, search]);

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
            renderItem={(item) => {
              return (
                <div className="flex items-center gap-1">
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
            placeholder="Search..."
            value={search}
            disabled={loading}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {loading && (
          <div className="bg-white p-6 w-full flex items-center justify-center">
            <SpinnerLoader size="sm" />
          </div>
        )}
        {!loading && filteredRepos.length === 0 && (
          <div
            className={clsx(
              "text-center flex justify-center w-full",
              "text-xs",
              theme.text1,
            )}
          >
            No repos found.
          </div>
        )}
        {filteredRepos.map((repo) => (
          <button
            key={repo.id}
            className={clsx(
              "text-xs px-2.5 py-1.5 gap-1",
              "w-full text-left flex items-center",
              "rounded transition-all border",
              theme.text1,
              theme.bgInputHover,
              theme.focusInput,
              theme.bgInput,
              theme.borderInput,
            )}
            onClick={() => {
              setRepositoryId(repo.full_name);
            }}
          >
            <div className="flex items-center gap-2">
              <img className="w-4 h-4" src={repo.owner.avatar_url} />
              <div>{repo.full_name}</div>
            </div>
            <div className="flex flex-grow justify-end">
              <StatusDot selected={repositoryId === repo.full_name} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
