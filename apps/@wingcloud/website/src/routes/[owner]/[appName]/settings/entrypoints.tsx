import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { SectionTitle } from "../../../../components/section-title.js";
import { SpinnerLoader } from "../../../../components/spinner-loader.js";
import { Button } from "../../../../design-system/button.js";
import { useNotifications } from "../../../../design-system/notification.js";
import { Select } from "../../../../design-system/select.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { wrpc, type App } from "../../../../utils/wrpc.js";

import { EntrypointUpdateModal } from "./_components/entrypoint-update-modal.js";

export interface EntrypointsProps {
  app?: App;
  loading: boolean;
}

export const Entrypoints = ({ app, loading }: EntrypointsProps) => {
  const { theme } = useTheme();
  const { showNotification } = useNotifications();

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const [entrypoint, setEntrypoint] = useState<string>();

  const repositoryQuery = wrpc["github.getRepository"].useQuery(
    {
      owner: app?.repoOwner || "",
      repo: app?.repoName || "",
    },
    {
      enabled: app != undefined,
    },
  );

  const entrypointsQuery = wrpc["app.listEntrypoints"].useQuery(
    {
      owner: app?.repoOwner || "",
      repo: app?.repoName || "",
      default_branch: repositoryQuery.data?.repository.default_branch || "",
    },
    {
      enabled: app != undefined && repositoryQuery.data !== undefined,
    },
  );

  const isValidEntrypoint = useMemo(() => {
    if (!app?.entrypoint || !entrypointsQuery.data) {
      return true;
    }
    return entrypointsQuery.data.entrypoints.includes(app.entrypoint);
  }, [app, entrypointsQuery.data]);

  const entrypoints = useMemo(() => {
    return (
      entrypointsQuery.data?.entrypoints.map((e) => ({
        value: e,
        label: e,
      })) || [{ value: app?.entrypoint || "", label: app?.entrypoint || "" }]
    );
  }, [app, entrypointsQuery.data]);

  const updateEntrypointMutation = wrpc["app.updateEntrypoint"].useMutation();

  const updateEntrypoint = useCallback(async () => {
    try {
      await updateEntrypointMutation.mutateAsync({
        appId: app?.appId!,
        entrypoint: entrypoint!,
      });
      showNotification("Succefully updated the app's entrypoint");
      setConfirmationModalOpen(false);
    } catch (error) {
      setConfirmationModalOpen(false);
      if (error instanceof Error) {
        showNotification("Failed to update the app's entrypoint", {
          body: error.message,
          type: "error",
        });
      }
    }
  }, [app?.appId, entrypoint, updateEntrypointMutation]);

  return (
    <div className="relative">
      <div
        className={clsx(
          "absolute inset-0 flex items-center justify-center",
          "transition-all",
          loading && "bg-opacity-50 z-10",
          !loading && "bg-opacity-0 -z-10",
          theme.bg3,
        )}
      >
        <SpinnerLoader size="sm" />
      </div>

      <div className="space-y-2">
        <SectionTitle>Entrypoints</SectionTitle>
        <div
          className={clsx(
            "space-y-2",
            "flex flex-col gap-x-2 rounded-md p-4 border",
            theme.bgInput,
            theme.borderInput,
          )}
        >
          <div className={clsx("flex flex-col text-x truncate", theme.text1)}>
            <div className="flex flex-row items-center gap-2">
              {!isValidEntrypoint && !entrypointsQuery.isLoading && (
                <ExclamationTriangleIcon
                  title="The configured entrypoint file could not be found in this repository."
                  className="h-4 w-4 flex-shrink-0 text-orange-600"
                />
              )}
            </div>
          </div>
          <div className="flex gap-x-2">
            <Select
              items={entrypoints}
              value={
                entrypoint === undefined ? app?.entrypoint || "" : entrypoint
              }
              placeholder={loading ? "Loading..." : "Select entrypoint"}
              onChange={setEntrypoint}
              disabled={
                updateEntrypointMutation.isPending ||
                loading ||
                entrypointsQuery.isLoading ||
                entrypointsQuery.data === undefined
              }
              className="w-full"
            />
            <Button
              onClick={() => setConfirmationModalOpen(true)}
              disabled={
                updateEntrypointMutation.isPending ||
                !entrypoint ||
                app?.entrypoint === entrypoint
              }
              className="truncate"
            >
              Save
            </Button>
          </div>
          <hr className="h-px mt-4 mb-2 bg-slate-200 border-0 dark:bg-slate-700" />
          <div className="flex flex-row gap-2">
            <ExclamationCircleIcon
              className={clsx("h-4 w-4 flex-shrink-0", theme.text2)}
            />
            <span className={clsx("text-xs truncate", theme.text2)}>
              Updating this property will restart all active environments. Learn
              more about{" "}
              <a
                className={clsx(
                  "text-blue-600",
                  "focus:underline outline-none",
                  "hover:underline z-10 cursor-pointer",
                )}
                href="https://www.winglang.io/docs/language-reference#112-execution-model"
                target="_blank"
              >
                Entrypoints
              </a>{" "}
            </span>
          </div>
        </div>
      </div>
      <EntrypointUpdateModal
        appName={app?.appName || ""}
        show={confirmationModalOpen}
        isIdle={updateEntrypointMutation.isIdle}
        isPending={updateEntrypointMutation.isPending}
        onClose={setConfirmationModalOpen}
        onConfirm={updateEntrypoint}
      />
    </div>
  );
};
