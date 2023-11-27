import { UserCircleIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";

import { Menu } from "../design-system/menu.js";
import { useTheme } from "../design-system/theme-provider.js";
import { WingIcon } from "../icons/wing-icon.js";
import { wrpc } from "../utils/wrpc.js";

export interface Breadcrumb {
  label: string;
  to: string;
}

const UserMenu = () => {
  const signOutMutation = wrpc["auth.signout"].useMutation();

  const signOut = useCallback(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    signOutMutation.mutateAsync(undefined).then(() => {
      location.href = "/";
    });
  }, [signOutMutation]);

  return (
    <Menu
      btnClassName="flex items-center rounded-full"
      items={[
        {
          label: "Sign out",
          onClick: () => {
            signOut();
          },
        },
      ]}
      icon={
        <UserCircleIcon
          className={clsx(
            "w-8 h-8 text-slate-400",
            "group-hover:text-slate-500 transition-all",
            "group-focus:text-slate-500",
          )}
        />
      }
    />
  );
};

export const Header = () => {
  const { theme } = useTheme();
  const location = useLocation();

  const user = wrpc["auth.check"].useQuery();

  const breadcrumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter((part) => part !== "");
    return parts.map((part, index) => {
      const to = `/${parts.slice(0, index + 1).join("/")}`;
      return {
        label: part,
        to: `${to}`,
      };
    });
  }, [location.pathname]);

  return (
    <header className={clsx("p-6 shadow z-10", theme.bgInput)}>
      <nav className="flex" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-2 truncate">
          <li>
            <div>
              <Link
                to={`/${user.data?.username}`}
                aria-disabled={!user.data?.username}
                className={clsx(theme.text1, theme.text1Hover)}
              >
                <WingIcon className="h-5 w-auto" />
              </Link>
            </div>
          </li>
          {breadcrumbs.map((breadcrumb, index) => {
            return (
              <li key={index} className="truncate">
                <div className="flex items-center truncate">
                  <ChevronRightIcon
                    className={clsx("h-4 w-4 flex-shrink-0", theme.text1)}
                  />
                  <Link
                    className={clsx(
                      "ml-2 text-sm font-medium truncate",
                      theme.text1,
                      theme.text1Hover,
                    )}
                    to={breadcrumb.to}
                  >
                    {breadcrumb.label}
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex grow justify-end gap-x-12">
          <UserMenu />
        </div>
      </nav>
    </header>
  );
};
