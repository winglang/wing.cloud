import { LinkIcon, SquaresPlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";

import { Button } from "../../design-system/button.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { AppConfigurationListItem } from "./components/app-configuration-list-item.js";
import { NewAppContainer } from "./components/new-app-container.js";

export const Component = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <NewAppContainer>
      <div className="w-full space-y-4">
        <div className={clsx(theme.text1)}>Select a configuration</div>
        <div className="space-y-2">
          <AppConfigurationListItem
            name="Connect"
            description="Connect to an existing repository"
            icon={<LinkIcon className="w-5 h-5" />}
            onClick={() => {
              navigate("/apps/new/connect/");
            }}
          />
          <AppConfigurationListItem
            name=""
            description="More coming soon!"
            icon={<SquaresPlusIcon className="w-5 h-5" />}
            disabled={true}
            classname="opacity-50 cursor-default"
          />
        </div>

        <div className="w-full flex">
          <div className="justify-end flex gap-x-2 grow">
            <Button
              onClick={() => {
                navigate("/apps/");
              }}
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </NewAppContainer>
  );
};
