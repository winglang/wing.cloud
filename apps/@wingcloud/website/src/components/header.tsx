import { ChevronRightIcon, UserCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useState } from "react";
import { Link } from "react-router-dom";

import { WingIcon } from "../icons/wing-icon.js";

export interface Breadcrumb {
  label: string;
  to: string;
}

export interface HeaderProps {
  breadcrumbs: Breadcrumb[];
}

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const signOut = () => {
    window.location.href = "/wrpc/auth.signOut";
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className={clsx(
            "flex items-center rounded-full bg-gray-100 ",
            "text-gray-400 hover:text-gray-600",
            "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
          )}
          aria-expanded="true"
          aria-haspopup="true"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          <span className="sr-only">Open options</span>
          <UserCircleIcon className="w-8 h-8 text-slate-400" />
        </button>
      </div>

      <div
        className={clsx(
          "absolute right-0 z-10 mt-2 w-56 origin-top-right",
          "rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
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
