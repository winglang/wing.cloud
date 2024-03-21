import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SectionTitle } from "../../../components/section-title.js";
import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { AuthDataProviderContext } from "../../../data-store/auth-data-provider.js";
import { Input } from "../../../design-system/input.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { wrpc } from "../../../utils/wrpc.js";

import { UserMenu } from "./user-menu.js";

export interface AdminPageProps {
  ownerParam: string;
}

export const AdminPage = (props: AdminPageProps) => {
  const { theme } = useTheme();

  const { user: currentUser } = useContext(AuthDataProviderContext);

  const [search, setSearch] = useState("");

  const { isLoading, data, refetch } = wrpc["admin.users.list"].useQuery();

  const filteredUsers = useMemo(() => {
    if (!data?.users) {
      return [];
    }

    return data.users.filter((user) =>
      user.username.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

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
          <SpinnerLoader />
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-wrap gap-6 w-full">
          <div className="w-full space-y-2">
            <SectionTitle>Users</SectionTitle>
            <div className="overflow-x-auto relative shadow-sm rounded-md w-full">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-600 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 w-20 text-center"></th>
                    <th className="px-4 py-2 w-1/3">Username</th>
                    <th className="px-4 py-2 w-1/3">Email</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={clsx(
                        "border-b transition-all text-xs relative",
                        "bg-white hover:bg-gray-50",
                      )}
                    >
                      <td className="px-4 py-2 flex justify-center">
                        <img
                          className="size-6 rounded-full"
                          src={
                            user.avatarUrl ||
                            "https://avatars.dicebear.com/api/initials/unknown.svg"
                          }
                        />
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
                        <Link
                          className={clsx(
                            "absolute inset-0 rounded-md z-0",
                            theme.focusVisible,
                          )}
                          to={`/${user.username}`}
                        />

                        <div className="flex gap-x-4 items-center justify-end">
                          {user.isAdmin && (
                            <div className="text-white bg-orange-400 rounded px-1.5 text-2xs font-bold">
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
                      <td
                        colSpan={4}
                        className="text-center px-4 py-2 bg-white"
                      >
                        <div className="h-6 text-xs flex items-center justify-center">
                          No users found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
