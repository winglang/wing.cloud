import { LinkIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AppConfigTypeList,
  type ConfigurationType,
} from "../components/app-config-type-list.js";
import { GitRepoSelect } from "../components/git-repo-select.js";
import { SpinnerLoader } from "../components/spinner-loader.js";
import { Button } from "../design-system/button.js";
import { Checkbox } from "../design-system/checkbox.js";
import { useTheme } from "../design-system/theme-provider.js";
import { usePopupWindow } from "../utils/popup-window.js";
import { wrpc } from "../utils/wrpc.js";

const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

export const Component = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const openPopupWindow = usePopupWindow();

  const [installationId, setInstallationId] = useState<string>();
  const [repositoryId, setRepositoryId] = useState("");
  const [configurationType, setConfigurationType] = useState<
    ConfigurationType | undefined
  >("connect");

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
        <div className="flex justify-center pt-10 max-w-2xl mx-auto">
          <div
            className={clsx(
              "w-full rounded-lg shadow-xl border p-6 space-y-4",
              theme.bgInput,
            )}
          >
            <div className={clsx(theme.text1, "font-semibold text-lg")}>
              Create a new App
            </div>

            <div className="gap-y-8 mb-4 flex flex-col w-full text-sm">
              <div className="w-full space-y-2">
                <div className={clsx(theme.text2)}>Select a Git Repository</div>

                <GitRepoSelect
                  installationId={installationId}
                  setInstallationId={setInstallationId}
                  repositoryId={repositoryId}
                  setRepositoryId={setRepositoryId}
                  installations={installations}
                  repos={repos}
                  loading={listReposQuery.isFetching}
                />
              </div>

              <div className="w-full space-y-2">
                <div className={clsx(theme.text2)}>Starter configuration</div>
                <AppConfigTypeList
                  onSetType={setConfigurationType}
                  type={configurationType}
                  disabled={!repositoryId}
                />
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
