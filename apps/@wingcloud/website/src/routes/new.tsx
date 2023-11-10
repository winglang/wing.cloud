import { LinkIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SpinnerLoader } from "../components/spinner-loader.js";
import { Button } from "../design-system/button.js";
import { Checkbox } from "../design-system/checkbox.js";
import { Combobox } from "../design-system/combobox.js";
import { Select } from "../design-system/select.js";
import { useTheme } from "../design-system/theme-provider.js";
import { usePopupWindow } from "../utils/popup-window.js";
import { wrpc } from "../utils/wrpc.js";

const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

export type ConfigurationType = "connect";

export const Component = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const openPopupWindow = usePopupWindow();

  const [installationId, setInstallationId] = useState<string>();
  const [repositoryId, setRepositoryId] = useState("");

  const [configurationType, setConfigurationType] = useState<
    ConfigurationType | undefined
  >("connect");

  const toggleConfigType = useCallback(
    (type: ConfigurationType) => {
      if (configurationType === type) {
        // eslint-disable-next-line unicorn/no-useless-undefined
        setConfigurationType(undefined);
        return;
      }
      setConfigurationType(type);
    },
    [configurationType, setConfigurationType],
  );

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
          entryfile: "main.w",
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

  const noReposFound = useMemo(() => {
    return (
      !installationId || (!listReposQuery.isFetching && repos.length === 0)
    );
  }, [listReposQuery.isFetching, repos.length, installationId]);

  const selectRepoPlaceholder = useMemo(() => {
    if (listReposQuery.isFetching) {
      return "Loading...";
    }
    if (noReposFound) {
      return "No repositories found";
    }
    return "Select a GitHub repository";
  }, [listReposQuery.isFetching, noReposFound]);

  useEffect(() => {
    const firstInstallationId = installations[0]?.id.toString();
    if (firstInstallationId) {
      setInstallationId(firstInstallationId);
    }
  }, [installationsQuery.data]);

  useEffect(() => {
    setRepositoryId("");
  }, [installationId]);

  return (
    <>
      {installationsQuery.isLoading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {!installationsQuery.isLoading && (
        <div className="flex justify-center pt-10 max-w-3xl mx-auto">
          <div
            className={clsx(
              "w-full rounded-lg shadow-xl border p-6 space-y-4",
              theme.bgInput,
            )}
          >
            <div className={clsx(theme.text1, "font-semibold text-lg")}>
              Create a new App
            </div>

            <div className="gap-6 mb-4 flex flex-col w-full text-sm">
              <div className="w-full space-y-2">
                <div className={clsx(theme.text2)}>Select a Git Repository</div>

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
                      disabled={noReposFound || listReposQuery.isLoading}
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
              </div>

              <div className="w-full space-y-2">
                <div className={clsx(theme.text2)}>Starter configuration</div>
                <button
                  aria-disabled={!installationId}
                  className={clsx(
                    "w-full p-4 text-left flex items-center",
                    "rounded-md shadow-sm",
                    "transition-all hover:shadow",
                    "border",
                    theme.text1,
                    theme.bgInput,
                    theme.borderInput,
                    theme.focusInput,
                    "gap-1",
                  )}
                  onClick={() => {
                    toggleConfigType("connect");
                  }}
                >
                  <div className="flex gap-x-4 items-center">
                    <LinkIcon className="w-5 h-5" />
                    <div className="">
                      <div className={clsx(theme.text1)}>Connect</div>
                      <div className={clsx("text-xs", theme.text2)}>
                        Connect to an existing repository
                      </div>
                    </div>
                  </div>

                  <div className="flex grow justify-end text-slate-500 items-center">
                    <Checkbox
                      checked={configurationType === "connect"}
                      onChange={() => {
                        toggleConfigType("connect");
                      }}
                      className="cursor-pointer"
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
                    disabled={
                      createAppLoading ||
                      !installationId ||
                      !repositoryId ||
                      !configurationType
                    }
                  >
                    {createAppLoading ? "Creating..." : "Create new App"}
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
