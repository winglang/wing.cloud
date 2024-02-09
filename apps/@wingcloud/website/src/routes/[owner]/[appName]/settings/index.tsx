import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";
import { Button } from "../../../../design-system/button.js";
import { Input } from "../../../../design-system/input.js";
import { useNotifications } from "../../../../design-system/notification.js";
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

  const appQuery = wrpc["app.getByName"].useQuery(
    { owner: owner!, appName: appName! },
    { refetchOnMount: true },
  );

  const app = useMemo(() => {
    return appQuery.data?.app;
  }, [appQuery.data]);

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
    <>
      <div className={clsx("border-b", theme.border4, theme.bg4)}>
        <div className="w-full max-w-7xl overflow-auto mx-auto p-4 md:p-8 flex">
          <div className="space-y-1 flex-grow truncate">
            <div className={clsx("text-2xl font-semibold", theme.text1)}>
              Project Settings
            </div>
            <div className={clsx("text-sm w-full truncate h-5", theme.text3)}>
              {appName}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-7xl overflow-auto mx-auto p-4 md:p-8 relative">
        <div className="flex-grow space-y-4">
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
                  description === undefined
                    ? app?.description || ""
                    : description
                }
                type="text"
                containerClassName="w-full"
                placeholder={
                  appQuery.isLoading
                    ? "Loading..."
                    : "Describe your app here..."
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

          <Entrypoints app={app} loading={appQuery.isLoading} />

          <SecretsList appId={app?.appId} />

          <div
            className={clsx(
              "flex flex-col gap-2 rounded-md p-4 border",
              theme.bgInput,
              theme.borderInput,
            )}
          >
            <div className={clsx("truncate", theme.text1)}>Delete App</div>
            <div className="flex">
              <Button
                onClick={() => setDeleteModalOpen(true)}
                small
                disabled={appQuery.isLoading}
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
      </div>
    </>
  );
};

export const Component = () => {
  const { owner, appName } = useParams();

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[
          { label: appName!, to: `/${owner}/${appName}` },
          {
            label: "Settings",
            to: `/${owner}/${appName}/settings`,
            icon: <Cog6ToothIcon className="w-4 h-4 text-slate-500" />,
          },
        ]}
      />
      <ErrorBoundary>
        <SettingsPage owner={owner!} appName={appName!} />
      </ErrorBoundary>
    </div>
  );
};
