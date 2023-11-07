import { ChevronRightIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState } from "react";
import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

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
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const navigate = useNavigate();
  const signOutMutation = wrpc["auth.signout"].useMutation();

  const signOut = useCallback(() => {
    signOutMutation.mutateAsync({}).then(() => {
      navigate("/");
    });
  }, [navigate, signOutMutation]);

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className={clsx("group", "flex items-center rounded-full")}
          aria-expanded="true"
          aria-haspopup="true"
          onClick={toggleMenu}
        >
          <span className="sr-only">Open options</span>
          <UserCircleIcon
            className={clsx(
              "w-8 h-8 text-slate-400",
              "group-hover:text-slate-500 transition-all",
              "group-focus:text-slate-500",
            )}
          />
        </button>
      </div>

      <div
        className={clsx(
          "absolute right-0 z-10 mt-2 w-56 origin-top-right",
          "rounded bg-white shadow-lg",
          isOpen ? "block" : "hidden",
        )}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
      >
        <div className="py-1" role="none">
          <button
            className={clsx(
              "text-gray-700 block w-full px-4 py-2 text-left text-sm",
              "hover:bg-gray-100 hover:text-gray-900",
              "rounded",
              "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
            )}
            role="menuitem"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
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
                  <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-slate-700" />
                  <Link
                    className="ml-2 text-sm font-medium text-slate-700 hover:text-slate-600"
                    to={breadcrumb.to}
                  >
                    {breadcrumb.label}
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex grow justify-end items-center gap-x-12">
          <UserMenu />
        </div>
      </nav>
    </header>
  );
};
