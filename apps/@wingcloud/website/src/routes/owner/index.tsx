import {
  FolderPlusIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "../../components/header.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { Input } from "../../design-system/input.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { wrpc } from "../../utils/wrpc.js";

import { AppCard } from "./components/app-card.js";

export const Component = () => {
  const { owner } = useParams();
  const { theme } = useTheme();

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const listAppsQuery = wrpc["user.listApps"].useQuery({
    owner: owner!,
  });

  const apps = useMemo(() => {
    return listAppsQuery.data?.apps ?? [];
  }, [listAppsQuery.data]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) =>
      `${app.appName}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    );
  }, [listAppsQuery.data, search]);

  return (
    <div className="flex flex-col">
      <Header />
      <div
        className={clsx(
          "w-full flex-grow overflow-auto",
          "max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6",
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
              label="New"
              primary
              icon={PlusIcon}
              onClick={() => {
                navigate("/new");
              }}
            />
          )}
        </div>

        {listAppsQuery.isLoading && (
          <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <SpinnerLoader />
          </div>
        )}
        {!listAppsQuery.isLoading && (
          <>
            {filteredApps.length === 0 && (
              <div className="text-center">
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
                        navigate("/new");
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
                      navigate(`/${owner}/${app.appName}`);
                    }}
                    app={app}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
