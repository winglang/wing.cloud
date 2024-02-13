import clsx from "clsx";
import { useMemo, useState } from "react";
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
  const [loadingTab, setLoadingTab] = useState("");

  const current = useMemo(() => {
    return tabs.find((tab) => tab.to == location.pathname);
  }, [tabs]);

  return (
    <nav className="flex space-x-2" aria-label="Tabs">
      {tabs.map((tab) => (
        <div key={tab.name}>
          <Link
            to={tab.to}
            aria-disabled={loadingTab !== ""}
            onClick={() => setLoadingTab(tab.name)}
            className={clsx(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              "transition-all",
              (current?.name === tab.name || loadingTab === tab.name) && [
                theme.text1,
              ],
              current?.name !== tab.name &&
                loadingTab !== tab.name && [theme.text3, theme.text1Hover],
              theme.bgInput,
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
