import {
  FolderPlusIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SpinnerLoader } from "../components/spinner-loader.js";
import { Button } from "../design-system/button.js";
import { Input } from "../design-system/input.js";
import { useTheme } from "../design-system/theme-provider.js";
import { wrpc } from "../utils/wrpc.js";

import { AppCard } from "./apps/components/app-card.js";

export const Component = () => {
  const { theme } = useTheme();

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const listAppsQuery = wrpc["user.listApps"].useQuery();

  const apps = useMemo(() => {
    return listAppsQuery.data?.apps ?? [];
  }, [listAppsQuery.data]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) =>
      app.appName.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    );
  }, [listAppsQuery.data, search]);

  return (
    <>
      <div className="flex gap-x-2">
        <Input
          type="text"
          leftIcon={MagnifyingGlassIcon}
          className="block w-full"
          containerClassName="w-full"
          placeholder="Filter apps..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
        <Button
          label="New"
          primary
          icon={PlusIcon}
          onClick={() => {
            navigate("new");
          }}
        />
      </div>

      {listAppsQuery.isLoading && (
        <div className="flex justify-around py-8">
          <SpinnerLoader />
        </div>
      )}

      {!listAppsQuery.isLoading && (
        <>
          {filteredApps.length === 0 && (
            <div className="text-center py-8">
              <FolderPlusIcon
                className={clsx("w-12 h-12 mx-auto", theme.text2)}
              />
              <h3 className={clsx("mt-2 text-sm font-semibold", theme.text1)}>
                No apps found.
              </h3>

              {apps.length === 0 && (
                <div>
                  <p className={clsx("mt-1 text-sm", theme.text2)}>
                    Get started by creating a new app.
                  </p>
                  <Button
                    label="New App"
                    icon={PlusIcon}
                    primary
                    className="mt-6"
                    onClick={() => {
                      navigate("new");
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {filteredApps.length > 0 && (
            <div
              className={clsx(
                "flex flex-wrap gap-6 w-full",
                "py-4",
                "grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1",
              )}
            >
              {filteredApps.map((app) => (
                <AppCard
                  key={app.appId}
                  onClick={() => {
                    navigate(`/apps/${app.appName}`);
                  }}
                  app={app}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};
