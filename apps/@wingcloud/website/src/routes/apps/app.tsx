import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../../design-system/button.js";
import { Menu } from "../../design-system/menu.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { MenuIcon } from "../../icons/menu-icon.js";
import { wrpc } from "../../utils/wrpc.js";

import { DeleteModal } from "./components/delete-modal.js";
import { EnvironmentsList } from "./components/environments-list.js";

interface PageProps {
  appName: string;
}

const Page = ({ appName }: PageProps) => {
  const navigate = useNavigate();

  const app = wrpc["app.getByName"].useQuery({ appName });

  const environmentsQuery = wrpc["app.environments"].useQuery(
    { appName },
    {
      refetchInterval: 1000 * 10,
    },
  );
  const environments = useMemo(() => {
    return (
      environmentsQuery.data?.environments.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ) || []
    );
  }, [environmentsQuery.data]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const repoURL = useMemo(() => {
    if (!app.data) {
      return;
    }

    return `https://github.com/${app.data.app.repoOwner}/${app.data.app.repoName}`;
  }, [app.data]);

  const goToSettings = useCallback(async () => {
    navigate(`/apps/${appName}/settings`);
  }, [appName]);

  const { theme } = useTheme();

  return (
    <>
      <div
        className={clsx(
          "flex gap-x-2 rounded p-4 border",
          theme.bgInput,
          theme.borderInput,
        )}
      >
        {app.data?.app.imageUrl ? (
          <img
            src={app.data.app.imageUrl}
            alt=""
            className="w-14 h-14 rounded-full"
          />
        ) : (
          <div className="w-14 h-14 rounded-full animate-pulse bg-slate-300" />
        )}
        <div className="space-y-1 pt-2 truncate ml-2">
          <div className="text-slate-700 text-xl self-center truncate">
            {appName}
          </div>
        </div>

        <div className="flex grow justify-end items-end">
          <div className="flex flex-col justify-between gap-3 h-full items-end">
            <Menu
              items={[
                {
                  label: "Settings",
                  onClick: goToSettings,
                },
                {
                  label: "Delete App",
                  onClick: () => setDeleteModalOpen(true),
                },
              ]}
              icon={<MenuIcon className="h-4 w-4 text-slate-700" />}
            />

            <a href={repoURL} target="_blank">
              <Button className="truncate" disabled={!repoURL}>
                Git Repository
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="w-full relative">
        <EnvironmentsList
          environments={environments}
          loading={environmentsQuery.isLoading}
          appName={appName}
          repoUrl={repoURL}
        />
      </div>

      <DeleteModal
        appName={appName}
        show={deleteModalOpen}
        onClose={setDeleteModalOpen}
      />
    </>
  );
};

export const Component = () => {
  const { appName } = useParams();
  return (
    <>
      {!appName && <div>App not found</div>}
      {appName && <Page appName={appName} />}
    </>
  );
};
