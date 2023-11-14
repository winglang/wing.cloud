import { LinkIcon, SquaresPlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../design-system/button.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { AppConfigurationListItem } from "./components/app-configuration-list-item.js";
import { NewAppContainer } from "./components/new-app-container.js";

export const Component = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const onCancel = useCallback(() => {
    navigate("/apps/new");
  }, [navigate]);

  const onTypeChange = useCallback(
    (type: string) => {
      navigate(`/apps/new/${type}`);
    },
    [navigate],
  );

  return (
    <NewAppContainer>
      <div className="w-full space-y-2">
        <div className={clsx(theme.text1)}>Select a configuration</div>
        <AppConfigurationListItem
          name="Connect"
          description="Connect to an existing repository"
          icon={<LinkIcon className="w-5 h-5" />}
          onClick={() => {
            onTypeChange("connect");
          }}
        />
        <AppConfigurationListItem
          name=""
          description="More coming soon!"
          icon={<SquaresPlusIcon className="w-5 h-5" />}
          checked={false}
          disabled={true}
          classname="opacity-50 cursor-default"
        />
        <div className="w-full flex pt-4">
          <div className="justify-end flex gap-x-2 grow">
            <Button onClick={onCancel}>Back</Button>
          </div>
        </div>
      </div>
    </NewAppContainer>
  );
};
