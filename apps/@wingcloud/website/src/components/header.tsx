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
          <UserIcon className={clsx(theme.text2, theme.focusVisible)} />
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
          <p className="text-sm font-medium text-gray-900" role="none">
            {user?.email}
          </p>
        </div>
      )}
    </Menu>
  );
};

const Separator = () => {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0 text-gray-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
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

  const params = useParams();
  const owner = useMemo(() => {
    return params["owner"] ?? user?.username;
  }, [params["owner"], user?.username]);

  const ownerLink = useMemo(() => {
    return `/${owner}`;
  }, [owner]);

  return (
    <header
      className={clsx(
        "transition-all",
        "pt-4 shadow z-30",
        !tabs && "pb-4",
        theme.bgInput,
        theme.pagePadding,
      )}
    >
      <div className="flex items-center gap-6">
        <Link
          to={dashboardLink}
          className={clsx(theme.text1, theme.text1Hover, theme.focusVisible)}
          // HACK: This is a workaround for a bug in React Router where the
          // page components don't re-render when the URL changes.
          reloadDocument={dashboardLink !== ownerLink}
        >
          <WingIcon className="h-5 w-auto" />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <div>
            <Link
              to={ownerLink}
              className={clsx(
                "transition-all",
                "rounded hover:bg-gray-100 px-0 sm:px-2 py-1 text-sm font-medium flex items-center gap-1.5",
                "focus:bg-gray-50 focus:outline-none",
                theme.text1,
              )}
            >
              <UserIcon className="size-3.5" />
              {!owner && (
                <span className="w-32 bg-gray-300 animate-pulse rounded">
                  &nbsp;
                </span>
              )}
              {owner && <span>{owner}</span>}
            </Link>
          </div>
          {breadcrumbs?.map((breadcrumb, index) => (
            <Fragment key={index}>
              <Separator />
              <Link
                to={breadcrumb.to}
                className={clsx(
                  "transition-all",
                  "rounded hover:bg-gray-100 px-0 sm:px-2 py-1 text-sm font-medium flex items-center gap-1.5",
                  theme.text1,
                  "focus:bg-gray-50 focus:outline-none",
                )}
              >
                {breadcrumb.icon ? (
                  <span className="-ml-1">{breadcrumb.icon}</span>
                ) : undefined}
                <span
                  className={clsx(
                    {
                      "hidden sm:block":
                        breadcrumb.icon && index === breadcrumbs.length - 1,
                      "-ml-0.5": breadcrumb.icon,
                    },
                    "whitespace-nowrap",
                  )}
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
