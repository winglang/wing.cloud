import clsx from "clsx";
import { useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "../design-system/theme-provider.js";
import { Link } from "react-router-dom";

export interface Tab {
  name: string;
  to: string;
}

// Define the TabsProps interface
interface TabsProps {
  tabs: Tab[];
}

export const Tabs = ({ tabs }: TabsProps) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const location = useLocation();

  const current = useMemo(() => {
    return tabs.find((tab) => tab.to == location.pathname);
  }, [tabs]);

  const changeTab = (index: number) => {
    const to = tabs[index]?.to;
    if (!to) {
      return;
    }
    navigate(to);
  };

  return (
    <nav className="flex space-x-2">
      {tabs.map((tab) => (
        <div key={tab.name}>
          <Link
            to={tab.to}
            className={clsx(
              "rounded-md px-2 py-1 text-sm font-medium",
              "transition-all",
              current?.name === tab.name && [theme.text1],
              current?.name !== tab.name && [theme.text3, theme.text1Hover],
              theme.bgInput,
              theme.focusVisible,
              theme.bg3Hover,
            )}
            aria-current={current ? "page" : undefined}
          >
            {tab.name}
          </Link>
          <div
            className={clsx(
              "pb-2 mx-1",
              "border-gray-600",
              current?.name === tab.name && "border-b-2",
            )}
          />
        </div>
      ))}
    </nav>
  );
};
