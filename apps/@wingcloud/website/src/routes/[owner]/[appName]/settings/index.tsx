import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";
import { SpinnerLoader } from "../../../../components/spinner-loader.js";
import { Button } from "../../../../design-system/button.js";
import { useNotifications } from "../../../../design-system/notification.js";
import { Select } from "../../../../design-system/select.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { wrpc } from "../../../../utils/wrpc.js";

import { EntrypointUpdateModal } from "./_components/entrypoint-update-modal.js";
import { SecretsList } from "./_components/secrets-list.js";

const SettingsPage = () => {
  const { theme } = useTheme();
  const { owner, appName } = useParams();
  const { showNotification } = useNotifications();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const appQuery = wrpc["app.getByName"].useQuery(
    { owner: owner!, appName: appName! },
    { refetchOnMount: true },
  );

  const app = useMemo(() => {
    return appQuery.data?.app;
  }, [appQuery.data]);

  const repositoryQuery = wrpc["github.getRepository"].useQuery(
    {
      owner: app?.repoOwner || "",
      repo: app?.repoName || "",
    },
    {
      enabled: app != undefined,
    },
  );

  const entryfilesQuery = wrpc["app.listEntryfiles"].useQuery(
    {
      owner: app?.repoOwner || "",
      repo: app?.repoName || "",
      default_branch: repositoryQuery.data?.repository.default_branch || "",
    },
    {
      enabled: app != undefined && repositoryQuery.data !== undefined,
    },
  );

  const isValidEntryfile = useMemo(() => {
    if (!app?.entryfile || !entryfilesQuery.data) {
      return true;
    }
    return entryfilesQuery.data.entryfiles.includes(app.entryfile);
  }, [app, entryfilesQuery.data]);

  const entryfiles = useMemo(() => {
    return (
      entryfilesQuery.data?.entryfiles.map((e) => ({ value: e, label: e })) || [
        { value: app?.entryfile || "", label: app?.entryfile || "" },
      ]
    );
  }, [app, entryfilesQuery.data]);

  const [entryfile, setEntryfile] = useState(app?.entryfile);

  const updateEntryfileMutation = wrpc["app.updateEntryfile"].useMutation();

  const [loading, setLoading] = useState(false);

  const updateEntryfile = useCallback(async () => {
    try {
      setLoading(true);
      await updateEntryfileMutation.mutateAsync({
        appId: app?.appId!,
        entryfile: entryfile!,
      });
      appQuery.refetch();
      showNotification("Succefully updated the app's entryfile");
      setLoading(false);
      setConfirmModalOpen(false);
    } catch (error) {
      setLoading(false);
      setConfirmModalOpen(false);
      if (error instanceof Error) {
        showNotification("Failed to update the app's entryfile", {
          body: error.message,
          type: "error",
        });
      }
    }
  }, [app?.appId, entryfile, updateEntryfileMutation]);

  return (
    <div
      className={clsx(
        "w-full flex-grow overflow-auto",
        "max-w-5xl mx-auto p-4 sm:p-6",
      )}
    >
      {!app && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {app && (
        <div className="space-y-4">
          <div
            className={clsx(
              "flex flex-col gap-x-2 rounded p-4 border",
              theme.bgInput,
              theme.borderInput,
            )}
          >
            <div className={clsx("flex flex-col text-x truncate", theme.text1)}>
              <div className="flex flex-row items-center gap-2">
                <span>App Entrypoint</span>
                {!isValidEntryfile && !entryfilesQuery.isLoading && (
                  <ExclamationTriangleIcon
                    title="The configured entrypoint file could not be found in this repository."
                    className="h-4 w-4 flex-shrink-0 text-orange-600"
                  />
                )}
              </div>
            </div>
            <div className="w-full flex flex-row mt-2">
              <div className="w-full space-y-2">
                <div className="flex gap-2 w-full items-center">
                  <Select
                    items={entryfiles}
                    value={entryfile || app.entryfile}
                    onChange={setEntryfile}
                    disabled={entryfilesQuery.isLoading}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="pl-2">
                <Button
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={
                    loading || !entryfile || app.entryfile === entryfile
                  }
                  className="truncate"
                >
                  Save
                </Button>
              </div>
            </div>
            <hr className="h-px mt-4 mb-2 bg-gray-200 border-0 dark:bg-gray-700" />
            <div className="flex flex-row gap-2">
              <ExclamationCircleIcon
                className={clsx("h-4 w-4 flex-shrink-0", theme.text2)}
              />
              <span className={clsx("text-xs truncate", theme.text2)}>
                Updating this property will restart all active environments.
                Learn more about{" "}
                <a
                  className="text-blue-600"
                  href="https://www.winglang.io/docs/language-reference#112-execution-model"
                  target="_blank"
                >
                  Wing entrypoints
                </a>{" "}
              </span>
            </div>
          </div>

          <SecretsList appId={app.appId} />
        </div>
      )}

      {appName && app?.appId && (
        <EntrypointUpdateModal
          appName={appName}
          show={confirmModalOpen}
          isIdle={updateEntryfileMutation.isIdle}
          isPending={loading}
          onClose={setConfirmModalOpen}
          onConfirm={updateEntryfile}
        />
      )}
    </div>
  );
};

export const Component = () => {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <ErrorBoundary>
        <SettingsPage />
      </ErrorBoundary>
    </div>
  );
};
