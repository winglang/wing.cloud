import { UserCircleIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Menu } from "../design-system/menu.js";
import { WingIcon } from "../icons/wing-icon.js";
import { wrpc } from "../utils/wrpc.js";

export interface Breadcrumb {
  label: string;
  to: string;
}

const UserMenu = () => {
  const navigate = useNavigate();
  const signOutMutation = wrpc["auth.signout"].useMutation();

  const signOut = useCallback(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    signOutMutation.mutateAsync(undefined).then(() => {
      navigate("/");
    });
  }, [navigate, signOutMutation]);

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
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    if (location.pathname === "/new") {
      return [
        {
          label: "apps",
          to: "/apps",
        },
        {
          label: "new",
          to: "/new",
        },
      ];
    }

    const parts = location.pathname.split("/").filter((part) => part !== "");
    return parts.map((part, index) => {
      const to = `/${parts.slice(0, index + 1).join("/")}`;
      return {
        label: part,
        to,
      };
    });
  }, [location.pathname]);

  return (
    <header className={clsx("p-6", "bg-white", "shadow")}>
      <nav className="flex" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-2 truncate">
          <li>
            <div>
              <Link to="/" className="text-[#212627] hover:text-slate-800">
                <WingIcon className="h-5 w-auto" />
              </Link>
            </div>
          </li>
          {breadcrumbs.map((breadcrumb, index) => {
            return (
              <li key={index} className="truncate">
                <div className="flex items-center truncate">
                  <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-600" />
                  <Link
                    className="ml-2 text-sm font-medium text-slate-600 hover:text-slate-700 truncate"
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
