import { UserIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { Fragment, useContext, useMemo } from "react";
import { Link } from "react-router-dom";

import { AuthDataProviderContext } from "../data-store/auth-data-provider.js";
import { Menu } from "../design-system/menu.js";
import { useTheme } from "../design-system/theme-provider.js";
import { WingIcon } from "../icons/wing-icon.js";
import { wrpc } from "../utils/wrpc.js";

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
  avatarURL?: string;
}

const UserMenu = (props: UserMenuProps) => {
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
      icon={<Avatar avatarURL={props.avatarURL} />}
    />
  );
};

export interface HeaderProps {
  breadcrumbs?: Breadcrumb[];
}

export const Header = (props: HeaderProps) => {
  const { theme } = useTheme();

  const { user } = useContext(AuthDataProviderContext);

  const dashboardLink = useMemo(() => {
    if (user?.username) {
      return `/${user.username}`;
    }
    return "/dashboard";
  }, [user?.username]);

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
              {!user && (
                <>
                  {/* <span className="w-5 h-5 rounded bg-slate-300 animate-pulse"></span> */}
                  <span className="w-32 bg-slate-300 animate-pulse rounded">
                    &nbsp;
                  </span>
                </>
              )}
              {user && (
                <>
                  {/* <Avatar avatarURL={user.data.user.avatarUrl} /> */}
                  <span>{user?.username}</span>
                </>
              )}
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

        <UserMenu avatarURL={user?.avatarUrl} />
      </div>
    </header>
  );
};
