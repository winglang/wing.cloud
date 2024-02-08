import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { SpinnerLoader } from "../../../../components/spinner-loader.js";
import { Button } from "../../../../design-system/button.js";
import { Input } from "../../../../design-system/input.js";
import { useNotifications } from "../../../../design-system/notification.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { wrpc } from "../../../../utils/wrpc.js";
import { DeleteModal } from "../_components/delete-modal.js";

export const Component = () => {
  const { theme } = useTheme();
  const { owner, appName } = useParams();
  const { showNotification } = useNotifications();

  const [entrypointConfirmModalOpen, setEntrypointConfirmModalOpen] =
    useState(false);

  const appQuery = wrpc["app.getByName"].useQuery(
    { owner: owner!, appName: appName! },
    { refetchOnMount: true },
  );

  const app = useMemo(() => {
    return appQuery.data?.app;
  }, [appQuery.data]);

  const [description, setDescription] = useState<string>();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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
    <div>
      <div className="space-y-4">
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
                appQuery.isLoading ? "Loading..." : "Describe your app here..."
              }
              onChange={(event) => setDescription(event.target.value)}
              disabled={
                !app ||
                appQuery.isLoading ||
                updateAppDescriptionMutation.isPending
              }
              className="w-full"
            />
            <Button
              onClick={updateAppDescription}
              disabled={
                appQuery.isLoading ||
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

        <div
          className={clsx(
            "flex flex-col gap-2 rounded-md p-4 border",
            theme.bgInput,
            theme.borderInput,
          )}
        >
          <div className={clsx("truncate", theme.text1)}>Advanced</div>
          <div className="flex">
            <Button
              onClick={() => setDeleteModalOpen(true)}
              small
              disabled={appQuery.isLoading}
              className="truncate"
            >
              Delete App
            </Button>
          </div>
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
