import clsx from "clsx";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

  const location = useLocation();

  const current = useMemo(() => {
    return tabs.find((tab) => tab.to == location.pathname);
  }, [tabs, location]);

  return (
    <nav className="flex space-x-2">
      {tabs.map((tab) => (
        <div key={tab.name}>
          <Link
            to={tab.to}
            className={clsx(
              "rounded-md px-2 py-1 text-sm font-medium",
              "transition-all",
              current?.name === tab.name && [theme.text1, theme.text1Hover],
              current?.name !== tab.name && [theme.text3, theme.text3Hover],
              theme.bgInput,
              theme.focusVisible,
            )}
            aria-current={current?.name === tab.name ? "page" : undefined}
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
