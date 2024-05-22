import { SquaresPlusIcon } from "@heroicons/react/24/outline";
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
import { PageHeader } from "../../components/page-header.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { AuthDataProviderContext } from "../../data-store/auth-data-provider.js";
import { InstallationsDataProviderContext } from "../../data-store/installations-data-provider.js";
import { ReposDataProviderContext } from "../../data-store/repos-data-provider.js";
import { useNotifications } from "../../design-system/notification.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { TypeScriptIcon } from "../../icons/typescript-icon.js";
import { WingIcon } from "../../icons/wing-icon.js";
import { PopupWindowContext } from "../../utils/popup-window-provider.js";
import { useQueryCache } from "../../utils/use-query-cache.js";
import { wrpc, type Repository } from "../../utils/wrpc.js";

import { AppTemplateItem } from "./_components/app-template-item.js";
import { GitRepoSelect } from "./_components/git-repo-select.js";

export interface AddAppContainerProps {
  step?: {
    name: string;
    icon: ForwardRefExoticComponent<any>;
  };
}

const AddAppPage = () => {
  // @ts-ignore-next-line
  const { GITHUB_APP_NAME } = wing.env;

  const navigate = useNavigate();
  const { theme } = useTheme();

  const { showNotification } = useNotifications();
  const { openPopupWindow } = useContext(PopupWindowContext);

  const [createAppLoading, setCreateAppLoading] = useState(false);
  const [repositoryId, setRepositoryId] = useState<string>();

  const { user } = useContext(AuthDataProviderContext);

  const {
    installations,
    installationId,
    setInstallationId,
    isLoading: installationsIsLoading,
    isRefetching: installationsIsRefetching,
    refetch: refetchInstallations,
  } = useContext(InstallationsDataProviderContext);

  const {
    repos,
    isLoading: reposIsLoading,
    isRefetching: reposIsRefetching,
    refetch: refetchRepos,
  } = useContext(ReposDataProviderContext);

  const [repoItems, setRepoItems] = useState<Repository[]>([]);
  useEffect(() => {
    if (repos) {
      setRepoItems(repos);
    }
  }, [repos]);

  const loading = useMemo(() => {
    return (
      installationsIsLoading ||
      (installationId && reposIsLoading) ||
      installationsIsRefetching ||
      reposIsRefetching
    );
  }, [
    installationId,
    installationsIsLoading,
    reposIsLoading,
    installationsIsRefetching,
    reposIsRefetching,
  ]);

  const selectedRepo = useMemo(() => {
    if (!repos || !repositoryId) {
      return;
    }
    return repos.find((repo) => repo.full_name.toString() === repositoryId);
  }, [repos, repositoryId]);

  const createAppMutation = wrpc["app.create"].useMutation();
  const { addAppItemToAppList } = useQueryCache();

  const createApp = useCallback(async () => {
    if (!installationId || !selectedRepo || !user) {
      return;
    }
    setCreateAppLoading(true);
    try {
      await createAppMutation.mutateAsync(
        {
          owner: user?.username,
          appName: selectedRepo.name,
          defaultBranch: selectedRepo.default_branch,
          description: selectedRepo.description ?? "",
          repoName: selectedRepo.name,
          repoOwner: selectedRepo.owner.login,
        },
        {
          onError: (error) => {
            setCreateAppLoading(false);
            throw error;
          },
          onSuccess: (data) => {
            addAppItemToAppList(data.app);
            navigate(`/${data.app.appFullName}`);
          },
        },
      );
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
  }, [installationId, selectedRepo, user]);

  const onCloseMissingRepoModal = useCallback(async () => {
    setRepoItems([]);
    await refetchInstallations();
    if (installationId) {
      refetchRepos();
    }
  }, [installationId]);

  useEffect(() => {
    setRepositoryId("");
  }, [installationId]);

  useEffect(() => {
    if (repositoryId) {
      createApp();
    }
  }, [repositoryId]);

  return (
    <div className="overflow-auto">
      <PageHeader
        title="Add a new app"
        description=" Get started by connecting a Git Repository to create a new app."
        noBackground
      />
      <div className="overflow-auto">
        <div
          className={clsx(
            "space-y-4 pb-4 sm:pb-8",
            "transition-all",
            theme.pageMaxWidth,
            theme.pagePadding,
          )}
        >
          <div className="block space-y-4 lg:space-y-0 lg:flex gap-4 lg:gap-8">
            <div
              className={clsx(
                "w-full rounded-md p-6 sm:p-8 space-y-4 border",
                "shadow",
                theme.bg4,
                theme.borderInput,
              )}
            >
              <div className={clsx("text-lg font-semibold", theme.text1)}>
                Connect a Git Repository
              </div>
              <div className="w-full relative space-y-4">
                {createAppLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="absolute inset-0 bg-white dark:bg-gray-900 opacity-50" />
                    <SpinnerLoader className="z-20" />
                  </div>
                )}

                <GitRepoSelect
                  installationId={installationId}
                  setInstallationId={setInstallationId}
                  repositoryId={repositoryId || ""}
                  setRepositoryId={setRepositoryId}
                  installations={installations}
                  repos={repoItems}
                  loading={loading}
                  disabled={createAppLoading}
                />

                <div className="text-xs flex gap-1 items-center pt-4 border-t border-gray-200">
                  <span className={clsx(theme.text1)}>
                    Missing a repository?
                  </span>
                  <button
                    className={clsx(
                      "text-left hover:underline",
                      theme.textFocus,
                    )}
                    onClick={() =>
                      openPopupWindow({
                        url: `https://github.com/apps/${GITHUB_APP_NAME}/installations/select_target`,
                        onClose: onCloseMissingRepoModal,
                        width: 1024,
                        height: 720,
                      })
                    }
                  >
                    Adjust GitHub App Permissions
                  </button>
                </div>
              </div>
            </div>

            <div
              className={clsx(
                "w-full rounded-md p-6 sm:p-8 space-y-4 border",
                theme.bg4,
                theme.borderInput,
                "shadow-sm",
                "opacity-50 cursor-default",
                "flex flex-col",
              )}
            >
              <div className={clsx("text-lg font-semibold", theme.text1)}>
                Clone a Template
              </div>
              <div className="w-full">
                <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
                  <AppTemplateItem
                    title="Wing app"
                    description="Create a new Wing app from a template."
                    icon={<WingIcon className="text-[#8bc6bc]" />}
                    disabled
                    classname="cursor-default"
                  />
                  <AppTemplateItem
                    title="TypeScript"
                    description="Create a new TypeScript app from a template."
                    icon={<TypeScriptIcon className="text-[#2f74c0]" />}
                    disabled
                    classname="cursor-default"
                  />
                  <AppTemplateItem
                    title=""
                    description="More coming soon!"
                    icon={<SquaresPlusIcon />}
                    disabled
                    classname="cursor-default"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Component = () => {
  return (
    <div className="flex flex-col h-full">
      <ErrorBoundary>
        <Header />
        <AddAppPage />
      </ErrorBoundary>
    </div>
  );
};
