import {
  FolderPlusIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Duplicator } from "../../../components/duplicator.js";
import { AuthDataProviderContext } from "../../../data-store/auth-data-provider.js";
import { Button } from "../../../design-system/button.js";
import { Input } from "../../../design-system/input.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { wrpc } from "../../../utils/wrpc.js";
import { AppCardSkeleton } from "../_components/app-card-skeleton.js";
import { AppCard } from "../_components/app-card.js";

export interface OwnerPageProps {
  ownerParam: string;
}

export const OwnerPage = (props: OwnerPageProps) => {
  const { user } = useContext(AuthDataProviderContext);
  const owner = useMemo(() => {
    return props.ownerParam ?? user?.username;
  }, [props.ownerParam, user?.username]);
  useEffect(() => {
    console.log("OwnerPage", { owner });
  }, [owner]);
  const { theme } = useTheme();
  const { isLoading, data, isFetching } = wrpc["app.list"].useQuery(
    {
      owner: owner!,
    },
    {
      enabled: !!owner,
      // throwOnError: false,
    },
  );

  const apps = data?.apps;

  const loading = useMemo(() => {
    // Show loading if there are no apps until we redirect to add page
    return isLoading || !apps || apps.length === 0;
  }, [isLoading, apps]);

  useEffect(() => {
    if (!apps || isFetching) {
      return;
    }
    if (apps.length === 0) {
      navigate("/add");
    }
  }, [apps, isFetching]);

  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const filteredApps = useMemo(() => {
    if (!apps) {
      return [];
    }
    return apps
      .filter((app) =>
        `${app.appName}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase()),
      )
      .sort((a, b) => {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
  }, [apps, search]);

  return (
    <div className="space-y-4">
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
        {apps && apps.length > 0 && (
          <Button
            icon={PlusIcon}
            label="New App"
            onClick={() => {
              navigate("/add");
            }}
          />
        )}
      </div>

      {!loading && filteredApps.length === 0 && (
        <div className="text-center">
          <FolderPlusIcon className={clsx("w-12 h-12 mx-auto", theme.text2)} />
          <h3 className={clsx("mt-2 text-sm font-medium", theme.text1)}>
            No apps found.
          </h3>
        </div>
      )}

      <div
        className={clsx(
          "flex flex-wrap gap-6 w-full",
          "grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1",
        )}
      >
        {loading && (
          <Duplicator count={5}>
            <AppCardSkeleton />
          </Duplicator>
        )}

        {filteredApps.map((app) => (
          <AppCard key={app.appId} owner={owner || ""} app={app} />
        ))}
      </div>
    </div>
  );
};
