import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Cog6ToothIcon, UserIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { Fragment, useMemo } from "react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { Menu } from "../design-system/menu.js";
import { useTheme } from "../design-system/theme-provider.js";
import { WingIcon } from "../icons/wing-icon.js";
import { wrpc } from "../utils/wrpc.js";

export interface Breadcrumb {
  label: string;
  to: string;
  icon?: React.ReactNode;
}

const UserMenu = () => {
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
        <Cog6ToothIcon
          className={clsx(theme.text2, theme.focusInput, "w-5 h-5")}
        />
      }
    />
  );
};

const Avatar = ({ avatarURL }: { avatarURL?: string }) => {
  const { theme } = useTheme();
  return (
    <>
      {avatarURL && (
        <img
          className={clsx("h-5 w-5 rounded")}
          src={avatarURL}
          alt="User avatar"
        />
      )}
      {!avatarURL && (
        <UserIcon className={clsx(theme.text2, theme.focusInput, "w-5 h-5")} />
      )}
    </>
  );
};

export interface HeaderProps {
  breadcrumbs?: Breadcrumb[];
}

export const Header = (props: HeaderProps) => {
  const { theme } = useTheme();

  const user = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });

  useEffect(() => {
    if (user.isError) {
      window.location.href = "/";
    }
  }, [user.isError]);

  const dashboardLink = useMemo(() => {
    if (user.data?.user.username) {
      return `/${user.data.user.username}`;
    }
    return "/dashboard";
  }, [user.data?.user.username]);

  return (
    <header className={clsx("px-6 py-3 shadow z-30", theme.bgInput)}>
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
              className="rounded hover:bg-slate-100 px-2 py-1 text-sm text-slate-800 font-medium flex items-center gap-1.5"
            >
              <Avatar avatarURL={user.data?.user.avatarUrl} />
              <span>{user.data?.user.username}</span>
            </Link>
          </div>
          {props.breadcrumbs?.map((breadcrumb, index) => (
            <Fragment key={index}>
              <span className="text-slate-600 text-sm">/</span>
              <Link
                to={breadcrumb.to}
                className="rounded hover:bg-slate-100 px-2 py-1 text-sm text-slate-800 font-medium flex items-center gap-1.5"
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

        <div className="flex-grow"></div>

        <UserMenu />
      </div>
    </header>
  );
};
