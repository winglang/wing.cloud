import {
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { SectionTitle } from "../../components/section-title.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { AuthDataProviderContext } from "../../data-store/auth-data-provider.js";
import { Input } from "../../design-system/input.js";
import Popover from "../../design-system/popover.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { wrpc, type App, type User } from "../../utils/wrpc.js";

import { UserMenu } from "./_components/user-menu.js";

const AppList = ({ user, apps }: { user: User; apps: App[] }) => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-x-1">
      {apps.length > 0 && (
        <Popover
          classNames={clsx(
            "z-10",
            "rounded-full py-0.5 px-1.5 flex text-xs font-semibold",
            theme.textInput,
            "border",
            theme.borderInput,
            theme.focusVisible,
            theme.bg1,
            theme.bg2Hover,
            "transition-all",
          )}
          button={`${apps.length} app${apps.length > 1 ? "s" : ""}`}
        >
          <div className="flex gap-x-3">
            <div className="space-y-1">
              {apps.map((app) => (
                <div key={app.appId} className="flex gap-2 items-center">
                  <Link
                    className={clsx(
                      "hover:underline focus:underline outline-none",
                      "truncate relative z-10 flex gap-x-1",
                      theme.text1,
                      "text-xs",
                    )}
                    to={`/${user.username}/${app.appName}`}
                    rel="noopener noreferrer"
                  >
                    {app.appName}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Popover>
      )}
      {apps?.length === 0 && <div className="px-1.5">0 apps</div>}
    </div>
  );
};

const UsersPage = () => {
  const { theme } = useTheme();

  const [search, setSearch] = useState("");

  const {
    isLoading,
    data: usersData,
    refetch,
  } = wrpc["admin.users.list"].useQuery();

  const { data: appsData } = wrpc["admin.apps.list"].useQuery();

  const filteredUsers = useMemo(() => {
    if (!usersData?.users) {
      return [];
    }

    return usersData.users
      .filter((user) =>
        `${user.username.toLowerCase()}${user.email?.toLowerCase()}`.includes(
          search.toLowerCase(),
        ),
      )
      .sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) {
          return -1;
        }
        if (!a.isAdmin && b.isAdmin) {
          return 1;
        }
        return a.username.localeCompare(b.username);
      });
  }, [usersData, search]);

  const usersWithApps = useMemo(() => {
    if (!appsData?.apps) {
      return [];
    }

    return filteredUsers.map((user) => {
      const userApps = appsData.apps.filter((app) => app.userId === user.id);
      return {
        ...user,
        apps: userApps,
      };
    });
  }, [filteredUsers, appsData]);

  const { user: currentUser } = useContext(AuthDataProviderContext);

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
      </div>
      {isLoading && (
        <div className="w-full flex justify-center p-4">
          <SpinnerLoader size="md" />
        </div>
      )}

      <SectionTitle>
        <div className="flex items-center gap-x-2">
          <div className="flex gap-x-1">
            <span>Users</span>
            <span className="text-gray-500 font-normal">
              ({usersWithApps.length})
            </span>
          </div>
        </div>
      </SectionTitle>

      {!isLoading && (
        <table
          className={clsx(
            "w-full text-sm text-left text-gray-500 dark:text-gray-400 border",
            theme.bgInput,
            theme.borderInput,
          )}
        >
          <thead className="text-xs text-gray-600 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-2 w-20 text-center"></th>
              <th className="px-4 py-2 w-1/3">Username</th>
              <th className="px-4 py-2 w-1/3">Email</th>
              <th className="px-4 py-2 w-1/3">Apps</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {usersWithApps.map((user) => (
              <tr
                key={user.id}
                className={clsx(
                  "border-b transition-all text-xs relative",
                  "bg-white hover:bg-slate-50",
                )}
              >
                <td className="px-4 py-2 flex justify-center">
                  {user.avatarUrl && (
                    <img className="size-6 rounded-full" src={user.avatarUrl} />
                  )}
                  {!user.avatarUrl && (
                    <UserCircleIcon className="size-6 text-gray-400" />
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-x-2">
                    <div>{user.username}</div>
                    <div className="text-gray-400">
                      {user.id === currentUser?.id && "(You)"}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">
                  <AppList user={user} apps={user.apps} />
                </td>
                <td className="px-4 py-2">
                  <Link
                    className={clsx(
                      "absolute inset-0 rounded-md z-0",
                      theme.focusVisible,
                    )}
                    to={`/${user.username}`}
                  />

                  <div className="flex gap-x-4 items-center justify-end">
                    {user.isAdmin && (
                      <div
                        className={clsx(
                          "text-white rounded px-1.5 text-2xs font-bold",
                          "bg-orange-500",
                        )}
                      >
                        Admin
                      </div>
                    )}
                    <div className="z-10">
                      <UserMenu user={user} onClose={() => refetch()} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center px-4 py-2 bg-white">
                  <div className="h-6 text-xs flex items-center justify-center">
                    No users found.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export const Component = () => {
  return <UsersPage />;
};
