import { LinkIcon, SquaresPlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { type ForwardRefExoticComponent, type PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary.js";
import { Header } from "../../components/header.js";
import { Button } from "../../design-system/button.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { AppConfigurationListItem } from "./_components/app-configuration-list-item.js";

export interface AddAppContainerProps {
  step?: {
    name: string;
    icon: ForwardRefExoticComponent<any>;
  };
}

const ChoosePage = () => {
  const { theme } = useTheme();

  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <div className={clsx("flex items-center gap-1", theme.text1)}>
        Add an app
      </div>

      <div className="mb-4 flex flex-col w-full text-sm">
        <div className="w-full">
          <div className="space-y-2">
            <AppConfigurationListItem
              name="Connect"
              description="Connect to an existing repository"
              icon={<LinkIcon className="w-5 h-5" />}
              onClick={() => {
                navigate(`/add/connect`);
              }}
            />
            <AppConfigurationListItem
              name=""
              description="More coming soon!"
              icon={<SquaresPlusIcon className="w-5 h-5" />}
              disabled={true}
              classname="opacity-50 cursor-default"
            />
            <div className="w-full flex pt-4">
              <div className="justify-end flex gap-x-2 grow">
                <Button
                  onClick={() => {
                    navigate("/dashboard");
                  }}
                >
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Component = () => {
  const navigate = useNavigate();

  const { theme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <Header />
      <ErrorBoundary>
        <div
          className={clsx(
            "w-full flex-grow",
            "max-w-5xl mx-auto p-4 sm:p-6",
            "space-y-4",
          )}
        >
          <div
            className={clsx(
              "w-full rounded p-6 space-y-4 border",
              theme.bg4,
              theme.borderInput,
            )}
          >
            <ChoosePage />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
