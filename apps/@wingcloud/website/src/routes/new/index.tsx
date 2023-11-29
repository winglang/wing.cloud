import { LinkIcon, SquaresPlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../../design-system/button.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { AppConfigurationListItem } from "./_components/app-configuration-list-item.js";
import { NewAppContainer } from "./_components/new-app-container.js";

export const Component = () => {
  const navigate = useNavigate();
  const { owner } = useParams();
  const { theme } = useTheme();

  return (
    <NewAppContainer>
      <div className="space-y-2">
        <div className={clsx(theme.text1)}>Select a configuration</div>
        <AppConfigurationListItem
          name="Connect"
          description="Connect to an existing repository"
          icon={<LinkIcon className="w-5 h-5" />}
          onClick={() => {
            navigate(`/new/connect`);
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
                navigate(`/${owner}`);
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
