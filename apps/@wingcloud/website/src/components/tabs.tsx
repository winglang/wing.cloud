import clsx from "clsx";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Tab as HeadlessTab } from "@headlessui/react";
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
  const navigate = useNavigate();

  const location = useLocation();

  const current = useMemo(() => {
    return tabs.find((tab) => tab.to == location.pathname);
  }, [tabs]);

  return (
    <HeadlessTab.Group
      onChange={(index) => {
        const to = tabs[index]?.to;
        if (!to) {
          return;
        }
        navigate(to);
      }}
    >
      <HeadlessTab.List className="flex space-x-2">
        {tabs.map((tab) => (
          <div key={tab.name}>
            <HeadlessTab
              onClick={() => navigate(tab.to)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                "transition-all",
                current?.name === tab.name && [theme.text1],
                current?.name !== tab.name && [theme.text3, theme.text1Hover],
                theme.bgInput,
                theme.focusVisible,
                theme.bg3Hover,
              )}
            >
              {tab.name}
            </HeadlessTab>
            <div
              className={clsx(
                "pb-1 mx-1",
                "border-gray-600",
                current?.name === tab.name && "border-b-2",
              )}
            />
          </div>
        ))}
      </HeadlessTab.List>
    </HeadlessTab.Group>
  );
};
