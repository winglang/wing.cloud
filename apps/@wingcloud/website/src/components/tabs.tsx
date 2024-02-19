import clsx from "clsx";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Tab as HeadlessTab } from "@headlessui/react";
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
    <HeadlessTab.Group onChange={changeTab}>
      <HeadlessTab.List className="flex space-x-2">
        {tabs.map((tab) => (
          <div key={tab.name} className="relative pb-2">
            <HeadlessTab
              as={Link}
              to={tab.to}
              className={clsx(
                "rounded-md px-2 py-1 text-sm font-medium",
                "transition-all",
                current?.name === tab.name && [theme.text1, theme.text1Hover],
                current?.name !== tab.name && [theme.text3, theme.text3Hover],
                theme.bgInput,
                theme.focusVisible,
              )}
            >
              {tab.name}
              <div
                className={clsx(
                  "absolute bottom-0 left-0 right-0 mx-1",
                  "pb-2",
                  "border-gray-600",
                  current?.name === tab.name && "border-b-2",
                )}
              />
            </HeadlessTab>
          </div>
        ))}
      </HeadlessTab.List>
    </HeadlessTab.Group>
  );
};
