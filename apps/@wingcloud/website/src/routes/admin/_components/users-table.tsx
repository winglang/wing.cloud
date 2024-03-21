import { UserCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useContext } from "react";
import { Link } from "react-router-dom";

import { AuthDataProviderContext } from "../../../data-store/auth-data-provider.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import type { User } from "../../../utils/wrpc.js";

import { UserMenu } from "./user-menu.js";

export const UsersTable = ({
  users,
  refetch,
}: {
  users: User[];
  refetch: () => void;
}) => {
  const { theme } = useTheme();

  const { user: currentUser } = useContext(AuthDataProviderContext);

  return (
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
        {users.map((user) => (
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
                      "bg-amber-600",
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
        {users.length === 0 && (
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
  );
};
