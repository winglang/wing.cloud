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
import { wrpc } from "../utils/wrpc.js";

import { AppCard } from "./apps/components/app-card.js";

export const Component = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const listAppsQuery = wrpc["user.listApps"].useQuery();

  const loading = useMemo(() => {
    return listAppsQuery.isFetching;
  }, [listAppsQuery.isFetching]);

  const apps = useMemo(() => {
    return listAppsQuery.data?.apps ?? [];
  }, [listAppsQuery.data]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) =>
      `${app.appName}${app.lastCommitMessage}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
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
          name="search"
          id="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
        {apps.length > 0 && (
          <Button
            label="New"
            primary
            icon={PlusIcon}
            onClick={() => {
              navigate("new");
            }}
          />
        )}
      </div>

      {loading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}
      {!loading && (
        <>
          {filteredApps.length === 0 && (
            <div className="text-center">
              <FolderPlusIcon className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No apps found.
              </h3>

              {apps.length === 0 && (
                <div>
                  <p className="mt-1 text-sm text-gray-500">
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
