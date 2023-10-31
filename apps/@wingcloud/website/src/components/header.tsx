import { ChevronRightIcon, UserCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { Link } from "react-router-dom";

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
              <Link to="/" className="text-gray-400 hover:text-gray-500">
                <img
                  className="h-8 w-auto"
                  src="../assets/icon-light.svg"
                  alt=""
                />
              </Link>
            </div>
          </li>
          {breadcrumbs.map((breadcrumb, index) => {
            return (
              <li key={index}>
                <div className="flex items-center">
                  <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  <Link
                    className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700"
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
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
          </button>
        </div>
      </nav>
    </header>
  );
};
