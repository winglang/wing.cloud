import { UserIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { Fragment, useContext, useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { AuthDataProviderContext } from "../data-store/auth-data-provider.js";
import { Menu } from "../design-system/menu.js";
import { useTheme } from "../design-system/theme-provider.js";
import { WingIcon } from "../icons/wing-icon.js";
import { wrpc, type User } from "../utils/wrpc.js";

import { Tabs, type Tab } from "./tabs.js";

export interface Breadcrumb {
  label: string;
  to: string;
  icon?: React.ReactNode;
}

const Avatar = ({ avatarURL }: { avatarURL?: string }) => {
  const { theme } = useTheme();
  return (
    <div className="rounded-full h-7 w-7 overflow-hidden hover:opacity-90 transition-all">
      {avatarURL && <img src={avatarURL} alt="User avatar" />}
      {!avatarURL && (
        <div className="p-0.5">
          <UserIcon className={clsx(theme.text2, theme.focusInput)} />
        </div>
      )}
    </div>
  );
};

interface UserMenuProps {
  user?: User;
}

const UserMenu = ({ user }: UserMenuProps) => {
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
      icon={<Avatar avatarURL={user?.avatarUrl} />}
    >
      {user?.email && (
        <div className="px-4 py-3" role="none">
          <p className="truncate text-sm font-medium text-gray-900" role="none">
            {user?.email}
          </p>
        </div>
      )}
    </Menu>
  );
};

export interface HeaderProps {
  breadcrumbs?: Breadcrumb[];
  tabs?: Tab[];
}

export const Header = ({ breadcrumbs, tabs }: HeaderProps) => {
  const { theme } = useTheme();

  const { user } = useContext(AuthDataProviderContext);

  const dashboardLink = useMemo(() => {
    if (user?.username) {
      return `/${user.username}`;
    }
    return "/dashboard";
  }, [user?.username]);

  return (
    <header
      className={clsx("px-6 shadow z-30 pt-3", theme.bgInput, !tabs && "pb-3")}
    >
      <div className="flex items-center gap-6">
        <Link
          to={dashboardLink}
          className={clsx(theme.text1, theme.text1Hover)}
        >
          <WingIcon className="h-5 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          <div>
            <Link
              to={dashboardLink}
              className={clsx(
                "rounded hover:bg-gray-100 px-2 py-1 text-sm font-medium flex items-center gap-1.5",
                theme.text1,
              )}
            >
              {!user && (
                <span className="w-32 bg-gray-300 animate-pulse rounded">
                  &nbsp;
                </span>
              )}
              {user && <span>{user.username}</span>}
            </Link>
          </div>
          {breadcrumbs?.map((breadcrumb, index) => (
            <Fragment key={index}>
              <span className="text-gray-600 text-sm">/</span>
              <Link
                to={breadcrumb.to}
                className={clsx(
                  "rounded hover:bg-gray-100 px-2 py-1 text-sm font-medium flex items-center gap-1.5",
                  theme.text1,
                )}
              >
                {breadcrumb.icon ? (
                  <span className="-ml-1">{breadcrumb.icon}</span>
                ) : undefined}
                <span
                  className={clsx({
                    "-ml-0.5": breadcrumb.icon,
                  })}
                >
                  {breadcrumb.label}
                </span>
              </Link>
            </Fragment>
          ))}
        </div>

        <div className="flex flex-grow justify-end items-center gap-x-2">
          <UserMenu user={user} />
        </div>
      </div>
      {tabs && (
        <div className="pt-3">
          <Tabs tabs={tabs} />
        </div>
      )}
    </header>
  );
};
