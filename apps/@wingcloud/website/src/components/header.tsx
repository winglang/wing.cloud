import { ChevronRightIcon, UserCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { Link } from "react-router-dom";

import { WingIcon } from "../icons/wing-icon.js";

export interface Breadcrumb {
  label: string;
  to: string;
}

export interface HeaderProps {
  breadcrumbs: Breadcrumb[];
}

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
          <button>
            <UserCircleIcon className="w-8 h-8 text-slate-400" />
          </button>
        </div>
      </nav>
    </header>
  );
};
