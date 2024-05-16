import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { Fragment, useCallback, useContext, useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { AuthDataProviderContext } from "../data-store/auth-data-provider.js";
import { ButtonLink } from "../design-system/button-link.js";
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
          icon: <ArrowLeftStartOnRectangleIcon className="size-5" />,
          onClick: () => {
            signOut.mutate(undefined);
          },
        },
      ]}
      icon={<Avatar avatarURL={user?.avatarUrl} />}
    >
      {user?.email && (
        <div className="px-3 py-3" role="none">
          <p className={clsx("text-sm font-medium", theme.text2)} role="none">
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
  const template = "feature.yml";
  const WING_CLOUD_FEEDBACK_URL = `https://t.winglang.io/discord`;
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

  const showAdminWarning = useMemo(() => {
    return user?.isAdmin && owner !== user?.username;
  }, [user?.isAdmin, owner, user?.username]);

  return (
    <>
      <header
        className={clsx(
          "transition-all",
          "pt-4 shadow z-30",
          !tabs && "pb-4",
          theme.bgInput,
          theme.pagePadding,
          "relative",
        )}
      >
        {showAdminWarning && (
          <div
            className={clsx(
              "absolute inset-x-0 top-full",
              "flex items-center justify-center",
              "border-t border-orange-500",
            )}
          >
            <div
              className={clsx(
                "text-2xs px-2",
                "text-gray-50 bg-orange-500",
                "rounded-b shadow",
                "text-center uppercase",
              )}
            >
              Admin mode
            </div>
          </div>
        )}
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
                  "focus-visible:bg-gray-50 outline-none",
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
                    "rounded hover:bg-gray-100 px-1 sm:px-2 py-1 text-sm font-medium flex items-center gap-1.5",
                    theme.text1,
                    "focus-visible:bg-gray-50 outline-none",
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

          <div className="flex flex-grow justify-end items-center gap-x-4">
            <ButtonLink
              small
              to={WING_CLOUD_FEEDBACK_URL}
              target="_blank"
              title="Feedback"
            >
              Give us feedback
            </ButtonLink>

            <UserMenu user={user} />
          </div>
        </div>
        {tabs && (
          <div className="pt-3 -mx-4">
            <div className="px-2">
              <Tabs tabs={tabs} />
            </div>
          </div>
        )}
      </header>
    </>
  );
};
