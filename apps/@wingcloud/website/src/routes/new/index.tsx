import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../design-system/button.js";

import { AppConfigurationList } from "./components/app-configuration-list.js";
import { NewAppContainer } from "./components/new-app-container.js";

export const Component = () => {
  const navigate = useNavigate();

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
      <div className="w-full space-y-8">
        <AppConfigurationList onSetType={onSetType} />
        <div className="w-full flex">
          <div className="justify-end flex gap-x-2 grow">
            <Button onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </div>
    </NewAppContainer>
  );
};
