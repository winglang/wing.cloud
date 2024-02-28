import { Cog8ToothIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { PageHeader } from "../../../../components/page-header.js";
import { SectionTitle } from "../../../../components/section-title.js";
import { SpinnerLoader } from "../../../../components/spinner-loader.js";
import { Button } from "../../../../design-system/button.js";
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

  return (
    <>
      <PageHeader
        title="Settings"
        noBackground
        icon={<Cog8ToothIcon className="size-full" />}
      />

      <div
        className={clsx(
          "space-y-4",
          "relative transition-all",
          theme.pageMaxWidth,
          theme.pagePadding,
        )}
      >
        <Entrypoints app={app} loading={isLoading} />

        <SecretsList appId={app?.appId} />

        <div className="space-y-2">
          <SectionTitle>Delete App</SectionTitle>
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
            <div className="flex">
              <Button
                onClick={() => setDeleteModalOpen(true)}
                disabled={isLoading}
                className="truncate"
              >
                Delete
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
    </>
  );
};

export const Component = () => {
  const { owner, appName } = useParams();

  return <SettingsPage owner={owner!} appName={appName!} />;
};
