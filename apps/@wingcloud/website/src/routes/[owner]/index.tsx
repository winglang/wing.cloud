import {
  FolderPlusIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary.js";
import { Header } from "../../components/header.js";
import { Button } from "../../design-system/button.js";
import { Input } from "../../design-system/input.js";
import { SkeletonLoader } from "../../design-system/skeleton-loader.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { wrpc } from "../../utils/wrpc.js";

import { AppCard } from "./_components/app-card.js";

const OwnerPage = () => {
  const { owner } = useParams();
  const { theme } = useTheme();

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const listAppsQuery = wrpc["app.list"].useQuery({
    owner: owner!,
  });

  const apps = useMemo(() => {
    return listAppsQuery.data?.apps ?? [];
  }, [listAppsQuery.data]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) =>
      `${app.appName}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    );
  }, [apps, search]);

  return (
    <div
      className={clsx(
        "w-full flex-grow overflow-auto",
        "max-w-5xl mx-auto p-4 sm:p-6",
        "space-y-4",
      )}
    >
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
            label="Add"
            primary
            icon={PlusIcon}
            onClick={() => {
              navigate("/add");
            }}
          />
        )}
      </div>

      {!listAppsQuery.isLoading && filteredApps.length === 0 && (
        <div className="text-center">
          <FolderPlusIcon className={clsx("w-12 h-12 mx-auto", theme.text2)} />
          <h3 className={clsx("mt-2 text-sm font-medium", theme.text1)}>
            No apps found.
          </h3>

          {apps.length === 0 && (
            <div>
              <p className={clsx("mt-1 text-sm", theme.text2)}>
                Get started by adding an app.
              </p>
              <Button
                label="Add app"
                icon={PlusIcon}
                primary
                className="mt-6"
                onClick={() => {
                  navigate("/add");
                }}
              />
            </div>
          )}
        </div>
      )}

      <div
        className={clsx(
          "flex flex-wrap gap-6 w-full",
          "grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1",
        )}
      >
        {listAppsQuery.isLoading &&
          Array.from({ length: apps.length || 3 }).map((_, i) => (
            <SkeletonLoader
              key={i}
              className={clsx("w-full h-20 rounded border", theme.borderInput)}
              loading
            />
          ))}

        {filteredApps.map((app) => (
          <AppCard
            key={app.appId}
            onClick={() => {
              navigate(`/${owner}/${app.appName}`);
            }}
            app={app}
          />
        ))}
      </div>
    </div>
  );
};

export const Component = () => {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <ErrorBoundary>
        <OwnerPage />
      </ErrorBoundary>
    </div>
  );
};
