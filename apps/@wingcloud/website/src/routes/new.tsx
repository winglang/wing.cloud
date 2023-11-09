import { LinkIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { set } from "zod";

import { SpinnerLoader } from "../components/spinner-loader.js";
import { Button } from "../design-system/button.js";
import { Combobox } from "../design-system/combobox.js";
import { Input } from "../design-system/input.js";
import { Select } from "../design-system/select.js";
import { usePopupWindow } from "../utils/popup-window.js";
import { wrpc, type Repository } from "../utils/wrpc.js";

const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

export const Component = () => {
  const navigate = useNavigate();
  const openPopupWindow = usePopupWindow();

  const [entryfile, setEntryfile] = useState("main.w");
  const [installationId, setInstallationId] = useState<string>();
  const [repositoryId, setRepositoryId] = useState("");

  const installationsQuery = wrpc["github.listInstallations"].useQuery();
  const installations = useMemo(() => {
    if (!installationsQuery.data) {
      return [];
    }
    return installationsQuery.data.installations;
  }, [installationsQuery.data]);

  useEffect(() => {
    const firstInstallationId = installations[0]?.id.toString();
    if (firstInstallationId) {
      setInstallationId(firstInstallationId);
    }
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

  const [createAppLoading, setCreateAppLoading] = useState(false);
  const createAppMutation = wrpc["user.createApp"].useMutation();

  const createApp = useCallback(
    async (repoId: string) => {
      const repo = repos.find((repo) => repo.full_name.toString() === repoId);
      if (!repo) {
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
          entryfile,
          default_branch: repo.default_branch,
          imageUrl: repo.owner.avatar_url,
          installationId: installationId!,
        },
        {
          onError: (error) => {
            console.error(error);
            setCreateAppLoading(false);
          },
        },
      );
      navigate("/apps");
    },
    [createAppMutation],
  );

  const onCloseRepositoryPopup = useCallback(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    setInstallationId(undefined);
    installationsQuery.refetch();
  }, [installationsQuery.data]);

  const loading = useMemo(() => {
    return installationsQuery.isLoading;
  }, [installationsQuery.isFetching]);

  const noReposFound = useMemo(() => {
    return (
      !installationId || (!listReposQuery.isFetching && repos.length === 0)
    );
  }, [listReposQuery.isFetching, repos.length, installationId]);

  return (
    <>
      {loading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {!loading && (
        <div className="flex justify-center pt-10 max-w-3xl mx-auto">
          <div className="w-full bg-white rounded-lg shadow-xl border p-6">
            <div className="gap-6 mb-4 flex flex-col text-sm w-full">
              <div className="flex gap-x-2 w-full items-center">
                <Select
                  items={installations.map((installation) => ({
                    value: installation.id.toString(),
                    label: installation.account.login,
                  }))}
                  placeholder="Select a GitHub namespace"
                  onChange={setInstallationId}
                  value={installationId}
                  btnClassName="w-full py-1.5 rounded-md border border-slate-300 mr-20 px-4 text-left shadow-sm"
                />
                <div className="text-slate-400 text-xl">/</div>
                <Combobox
                  items={
                    repos.map((repo) => ({
                      value: repo.full_name.toString(),
                      label: repo.name,
                    })) ?? []
                  }
                  value={repositoryId}
                  placeholder={
                    noReposFound
                      ? "No repositories found"
                      : "Select a GitHub repository"
                  }
                  onChange={setRepositoryId}
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

              <div className="justify-end flex flex-col">
                <button
                  aria-disabled={!installationId}
                  className={clsx(
                    "w-full p-2 text-left flex items-center",
                    "bg-white rounded-md shadow-sm border border-slate-300",
                    "transition-all hover:shadow",
                    "gap-1",
                  )}
                >
                  <div className="text-slate-600 flex gap-x-2 items-center">
                    <LinkIcon className="w-5 h-5" />
                    <span className="text-sm">
                      Connect to an existing repository
                    </span>
                  </div>

                  <div className="flex grow justify-end text-slate-500 items-center">
                    <Input
                      type="checkbox"
                      containerClassName="flex items-center justify-center"
                      onChange={() => {}}
                    />
                  </div>
                </button>
              </div>

              <div className="w-full flex">
                <div className="text-xs text-center flex gap-2 items-center">
                  <span>Missing Gint repository?</span>
                  <button
                    className="text-blue-600"
                    onClick={() =>
                      openPopupWindow({
                        url: `https://github.com/apps/${GITHUB_APP_NAME}/installations/select_target`,
                        onClose: onCloseRepositoryPopup,
                      })
                    }
                  >
                    Adjust GitHub App Permissions →
                  </button>
                </div>
                <div className="justify-end flex gap-x-2 grow">
                  <Button
                    onClick={() => {
                      navigate("/apps");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!installationId) {
                        return;
                      }
                      createApp(repositoryId);
                    }}
                    primary
                    disabled={!installationId}
                  >
                    Create new app
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
