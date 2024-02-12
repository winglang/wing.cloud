import clsx from "clsx";
import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "../design-system/theme-provider.js";

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

  const items = useMemo(() => {
    return tabs.map((tab) => {
      return {
        name: tab.name,
        value: tab.to,
      };
    });
  }, [tabs]);

  const current = useMemo(() => {
    return tabs.find((tab) => tab.to == location.pathname);
  }, [tabs]);

  return (
    <nav className="flex space-x-2" aria-label="Tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          to={tab.to}
          className={clsx(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            theme.textInput,
            theme.focusInput,
            current?.name === tab.name && [theme.bg2, theme.bg2Hover],
            current?.name !== tab.name && [theme.bgInput, theme.bgInputHover],
          )}
          aria-current={current ? "page" : undefined}
        >
          {tab.name}
        </Link>
      ))}
    </nav>
  );
};
