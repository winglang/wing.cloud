import clsx from "clsx";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "./theme-provider.js";

interface Item {
  label: string;
  to: string;
  icon?: React.ReactNode;
}

export interface SideBarNavProps {
  items: Item[];
}
const SideBarItem = ({ label, to, icon }: Item) => {
  const { theme } = useTheme();

  const active = useMemo(() => {
    return location.pathname === to;
  }, [to, location.pathname]);

  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center gap-x-2 truncate",
        "py-1.5 pl-3 rounded-md",
        "text-sm leading-6",
        theme.text1,
        theme.text1Hover,
        !active && "hover:bg-gray-150",
        active && "bg-gray-200 font-semibold",
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

export const SideBarNav = ({ items }: SideBarNavProps) => {
  return (
    <nav className="flex flex-1 flex-col w-full sticky">
      <ul role="list" className="-mx-2 space-y-1">
        {items.map((item) => (
          <li key={item.to}>
            <SideBarItem {...item} />
          </li>
        ))}
      </ul>
    </nav>
  );
};
