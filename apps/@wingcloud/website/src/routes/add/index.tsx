import {
  LinkIcon,
  SquaresPlusIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ForwardRefExoticComponent,
} from "react";
import { useNavigate } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary.js";
import { Header } from "../../components/header.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { useNotifications } from "../../design-system/notification.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { TypeScriptIcon } from "../../icons/typescript-icon.js";
import { WingIcon } from "../../icons/wing-icon.js";
import { useCreateAppFromRepo } from "../../services/create-app.js";
import { PopupWindowContext } from "../../utils/popup-window-provider.js";
import { wrpc } from "../../utils/wrpc.js";

import { AppTemplateItem } from "./_components/app-template-item.js";
import { GitRepoSelect } from "./_components/git-repo-select.js";

export interface AddAppContainerProps {
  step?: {
    name: string;
    icon: ForwardRefExoticComponent<any>;
  };
}

export const Component = () => {
  const navigate = useNavigate();

  const { theme } = useTheme();

  const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

  const { showNotification } = useNotifications();
  const { openPopupWindow } = useContext(PopupWindowContext);

  const {
    createApp,
    listInstallationsQuery,
    listReposQuery,
    installationId,
    setInstallationId,
    repositoryId,
    setRepositoryId,
    loading,
  } = useCreateAppFromRepo();

  const user = wrpc["auth.check"].useQuery();

  const [createAppLoading, setCreateAppLoading] = useState(false);

  const installationList = useMemo(() => {
    if (!listInstallationsQuery.data?.pages) {
      return [];
    }
    return listInstallationsQuery.data.pages.flatMap((page) => page.data);
  }, [listInstallationsQuery.data]);

  const reposList = useMemo(() => {
    if (!listReposQuery.data?.pages) {
      return [];
    }
    return listReposQuery.data.pages.flatMap((page) => page.data);
  }, [listReposQuery.data]);

  const selectedRepo = useMemo(() => {
    if (!reposList || !repositoryId) {
      return;
    }
    return reposList.find((repo) => repo.full_name.toString() === repositoryId);
  }, [reposList, repositoryId]);

  const onCreate = useCallback(async () => {
    if (!installationId || !selectedRepo || !user.data?.user) {
      return;
    }
    setCreateAppLoading(true);
    try {
      const app = await createApp({
        owner: user.data.user.username,
        appName: selectedRepo.name,
        description: selectedRepo.description ?? "",
        repoName: selectedRepo.name,
        repoOwner: selectedRepo.owner.login,
        defaultBranch: selectedRepo.default_branch,
      });
      navigate(`/${app?.appFullName}`);
    } catch (error) {
      setCreateAppLoading(false);
      if (error instanceof Error) {
        showNotification("Failed to create the app", {
          body: error.message,
          type: "error",
        });
        setRepositoryId("");
      }
    }
  }, [createApp, navigate]);

  useEffect(() => {
    if (repositoryId) {
      onCreate();
    }
  }, [repositoryId]);

  // If installation id was changed, refetch repos. Needed in case the user didn't have access to any repo before.
  useEffect(() => {
    if (installationId) {
      listReposQuery.refetch();
    }
  }, [installationId]);

  return (
    <div className="flex flex-col h-full">
      <Header />
      <ErrorBoundary>
        <div className="w-full max-w-7xl overflow-auto mx-auto p-4 space-y-4 md:p-8">
          <div className="space-y-1">
            <div className={clsx("text-2xl font-semibold", theme.text1)}>
              Add a new app
            </div>
            <div className={clsx("text-sm", theme.text3)}>
              Choose how you want to add your new app.
            </div>
          </div>

          <div className="block space-y-4 md:space-y-0 md:flex gap-4 md:gap-8">
            <div
              className={clsx(
                "w-full rounded-md p-8 space-y-8 border",
                "shadow",
                theme.bg4,
                theme.borderInput,
              )}
            >
              <div className="space-y-8">
                <div className="w-full space-y-4">
                  <div className={clsx("text-lg font-semibold", theme.text2)}>
                    Connect Git Repository
                  </div>
                  <div className="w-full relative space-y-4">
                    {createAppLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="absolute inset-0 bg-white dark:bg-slate-900 opacity-50" />
                        <SpinnerLoader className="z-20" />
                      </div>
                    )}

                    <GitRepoSelect
                      installationId={installationId}
                      setInstallationId={setInstallationId}
                      repositoryId={repositoryId || ""}
                      setRepositoryId={setRepositoryId}
                      installations={installationList}
                      repos={reposList}
                      loading={loading}
                      disabled={createAppLoading}
                    />

                    <div className="text-xs flex gap-1 items-center pt-4 border-t border-slate-200">
                      <span className={clsx(theme.text1)}>
                        Missing a repository?
                      </span>
                      <button
                        className="text-sky-600 text-left"
                        onClick={() =>
                          openPopupWindow({
                            url: `https://github.com/apps/${GITHUB_APP_NAME}/installations/select_target`,
                            onClose: async () => {
                              await listInstallationsQuery.refetch();
                              if (installationId) {
                                listReposQuery.refetch();
                              }
                            },
                          })
                        }
                      >
                        Adjust GitHub App Permissions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={clsx(
                "w-full rounded-md p-8 space-y-8 border",
                theme.bg3,
                theme.borderInput,
                "shadow-sm",
              )}
            >
              <div className="space-y-8">
                <div className="mb-4 flex flex-col w-full space-y-4">
                  <div className={clsx("text-lg font-semibold", theme.text2)}>
                    Clone Template
                  </div>
                  <div className="w-full">
                    <div className="gap-4 grid grid-cols-2">
                      <AppTemplateItem
                        name="Wing App"
                        description="Create a new Wing app from a template"
                        icon={<WingIcon className="w-8 h-8 text-[#8bc6bc]" />}
                        disabled
                      />
                      <AppTemplateItem
                        name="TypeScript"
                        description="Create a new TypeScript app from a template"
                        icon={
                          <TypeScriptIcon className="w-8 h-8 text-[#2f74c0]" />
                        }
                        disabled
                      />
                      <AppTemplateItem
                        name="More coming soon!"
                        icon={<SquaresPlusIcon className="w-8 h-8" />}
                        disabled
                        classname="opacity-50 cursor-default"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
