import { UserCircleIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { Menu } from "../design-system/menu.js";
import { useTheme } from "../design-system/theme-provider.js";
import { WingIcon } from "../icons/wing-icon.js";
import { wrpc } from "../utils/wrpc.js";

export interface Breadcrumb {
  label: string;
  to: string;
}

const UserMenu = ({ avatarUrl }: { avatarUrl?: string }) => {
  const { theme } = useTheme();

  const signOut = wrpc["auth.signOut"].useMutation({
    onSuccess(d) {
      location.href = "/";
    },
  });

  return (
    <Menu
      btnClassName="flex items-center rounded-full"
      items={[
        {
          label: "Sign out",
          onClick: () => {
            signOut.mutate(undefined);
          },
        },
      ]}
      icon={
        <>
          {avatarUrl && (
            <img
              className={clsx(
                "h-8 w-8 rounded-full",
                "border-2",
                theme.borderInput,
                theme.focusInput,
              )}
              src={avatarUrl}
              alt="User avatar"
            />
          )}
          {!avatarUrl && (
            <UserCircleIcon
              className={clsx(theme.text2, theme.focusInput, "w-8 h-8")}
            />
          )}
        </>
      }
    />
  );
};

export const Header = () => {
  const { theme } = useTheme();
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter((part) => part !== "");

    return parts.map((part, index) => {
      const to = `/${parts.slice(0, index + 1).join("/")}`;
      return {
        label: decodeURIComponent(part),
        to: `${to}`,
      };
    });
  }, [location.pathname]);

  const userQuery = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });

  useEffect(() => {
    if (userQuery.isError) {
      window.location.href = "/";
    }
  }, [userQuery.isError]);

  return (
    <header className={clsx("p-6 shadow z-10", theme.bgInput)}>
      <nav className="flex" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-2 truncate">
          <li>
            <div>
              <Link
                to="/dashboard"
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

        <div className="flex grow justify-end gap-x-12 shrink-0">
          <UserMenu avatarUrl={userQuery.data?.user.avatarUrl} />
        </div>
      </nav>
    </header>
  );
};
