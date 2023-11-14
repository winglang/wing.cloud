import clsx from "clsx";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../design-system/button.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { AppConfigurationList } from "./components/app-configuration-list.js";
import { NewAppContainer } from "./components/new-app-container.js";

export const Component = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const onCancel = useCallback(() => {
    navigate("/apps/new");
  }, [navigate]);

  const onSetType = useCallback(
    (type: string) => {
      navigate(`/apps/new/${type}`);
    },
    [navigate],
  );

  return (
    <NewAppContainer>
      <div className="w-full space-y-2">
        <div className={clsx(theme.text1)}>Select a configuration</div>
        <AppConfigurationList onSetType={onSetType} />
        <div className="w-full flex pt-4">
          <div className="justify-end flex gap-x-2 grow">
            <Button onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </div>
    </NewAppContainer>
  );
};
