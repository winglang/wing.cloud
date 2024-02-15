import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { SpinnerLoader } from "../../../../components/spinner-loader.js";
import { Button } from "../../../../design-system/button.js";
import { Input } from "../../../../design-system/input.js";
import { useNotifications } from "../../../../design-system/notification.js";
import { SkeletonLoader } from "../../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { wrpc } from "../../../../utils/wrpc.js";
import { DeleteModal } from "../_components/delete-modal.js";

import { SecretsList } from "./_components/secrets-list.js";
import { Entrypoints } from "./entrypoints.js";

const SettingsPage = ({
  owner,
  appName,
}: {
  owner: string;
  appName: string;
}) => {
  const { theme } = useTheme();
  const { showNotification } = useNotifications();

  const [description, setDescription] = useState<string>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const getAppQuery = wrpc["app.getByName"].useQuery(
    {
      owner: owner!,
      appName: appName!,
    },
    {
      enabled: !!owner && !!appName,
    },
  );
  const app = useMemo(() => {
    return getAppQuery.data?.app;
  }, [getAppQuery.data]);

  const isLoading = useMemo(() => {
    return getAppQuery.isLoading;
  }, [getAppQuery]);

  const updateAppDescriptionMutation =
    wrpc["app.updateDescription"].useMutation();

  const updateAppDescription = useCallback(async () => {
    if (description === app?.description) {
      return;
    }
    try {
      await updateAppDescriptionMutation.mutateAsync({
        appId: app?.appId!,
        description: description || "",
      });
      showNotification("Succefully updated the app's description");
    } catch (error) {
      if (error instanceof Error) {
        showNotification("Failed to update the app's description", {
          body: error.message,
          type: "error",
        });
      }
    }
  }, [app?.appId, description, updateAppDescriptionMutation]);

  return (
    <div className="flex-grow space-y-4">
      <div
        className={clsx(
          "flex flex-col gap-x-2 rounded-md p-4 border",
          theme.bgInput,
          theme.borderInput,
          "relative",
        )}
      >
        <div
          className={clsx(
            "absolute inset-0 flex items-center justify-center",
            "transition-all",
            isLoading && "bg-opacity-50 z-10",
            !isLoading && "bg-opacity-0 -z-10",
            theme.bg3,
          )}
        >
          <SpinnerLoader size="sm" />
        </div>

        <div className="space-y-2">
          <div className={clsx("flex flex-col text-x truncate", theme.text1)}>
            <div className="flex flex-row items-center gap-2">
              <span>App Description</span>
            </div>
          </div>
          <div className="flex gap-x-2">
            <Input
              value={
                description === undefined ? app?.description || "" : description
              }
              type="text"
              containerClassName="w-full"
              placeholder={
                isLoading ? "Loading..." : "Describe your app here..."
              }
              onChange={(event) => setDescription(event.target.value)}
              disabled={
                !app || isLoading || updateAppDescriptionMutation.isPending
              }
              className="w-full"
            />
            <Button
              onClick={updateAppDescription}
              disabled={
                isLoading ||
                updateAppDescriptionMutation.isPending ||
                description === undefined ||
                description === app?.description
              }
              className="truncate space-x-1"
            >
              {updateAppDescriptionMutation.isPending && (
                <SpinnerLoader size="xs" />
              )}
              <span>Save</span>
            </Button>
          </div>
        </div>
      </div>

      <Entrypoints app={app} loading={isLoading} />

      <SecretsList appId={app?.appId} />

      <div
        className={clsx(
          "flex flex-col gap-2 rounded-md p-4 border",
          theme.bgInput,
          theme.borderInput,
          "relative",
        )}
      >
        <div
          className={clsx(
            "absolute inset-0 flex items-center justify-center",
            "transition-all",
            isLoading && "bg-opacity-50 z-10",
            !isLoading && "bg-opacity-0 -z-10",
            theme.bg3,
          )}
        >
          <SpinnerLoader size="sm" />
        </div>
        <div className={clsx("truncate", theme.text1)}>Delete App</div>
        <div className="flex">
          <Button
            onClick={() => setDeleteModalOpen(true)}
            small
            disabled={isLoading}
            className="truncate"
          >
            Delete
          </Button>
        </div>
      </div>

      {appName && owner && app?.appId && (
        <DeleteModal
          appId={app.appId}
          owner={owner}
          appName={appName}
          show={deleteModalOpen}
          onClose={setDeleteModalOpen}
        />
      )}
    </div>
  );
};

export const Component = () => {
  const { owner, appName } = useParams();

  return <SettingsPage owner={owner!} appName={appName!} />;
};
