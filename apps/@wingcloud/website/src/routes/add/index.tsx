import { LinkIcon, SquaresPlusIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

import { Button } from "../../design-system/button.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { AddAppContainer } from "./_components/add-app-container.js";
import { AppConfigurationListItem } from "./_components/app-configuration-list-item.js";

export const Component = () => {
  const navigate = useNavigate();

  return (
    <AddAppContainer>
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
    </AddAppContainer>
  );
};
