import { UserCircleIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState } from "react";
import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Popover } from "../design-system/popover.js";
import { WingIcon } from "../icons/wing-icon.js";
import { wrpc } from "../utils/wrpc.js";

export interface Breadcrumb {
  label: string;
  to: string;
}

export interface HeaderProps {
  breadcrumbs: Breadcrumb[];
}

const UserMenu = () => {
  const navigate = useNavigate();
  const signOutMutation = wrpc["auth.signout"].useMutation();

  const signOut = useCallback(() => {
    signOutMutation.mutateAsync({}).then(() => {
      navigate("/");
    });
  }, [navigate, signOutMutation]);

  return (
    <Popover
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

export const Header = ({ breadcrumbs }: HeaderProps) => {
  return (
    <header className={clsx("p-6", "bg-white", "shadow")}>
      <nav className="flex" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-2">
          <li>
            <div>
              <Link to="/" className="text-[#212627] hover:text-slate-800">
                <WingIcon className="h-5 w-auto" />
              </Link>
            </div>
          </li>
          {breadcrumbs.map((breadcrumb, index) => {
            return (
              <li key={index}>
                <div className="flex items-center">
                  <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-600" />
                  <Link
                    className="ml-2 text-sm font-medium text-slate-600 hover:text-slate-700"
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
