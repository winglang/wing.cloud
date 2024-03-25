import clsx from "clsx";
import { useState, useCallback } from "react";

import { Button } from "../../../../../design-system/button.js";
import { useNotifications } from "../../../../../design-system/notification.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { wrpc, type App } from "../../../../../utils/wrpc.js";

const MAX_DESCRIPTION_LENGTH = 1000;

export const UpdateAppDescription = ({
  app,
  loading,
}: {
  app?: App;
  loading: boolean;
}) => {
  const { theme } = useTheme();
  const { showNotification } = useNotifications();

  const [newDescription, setNewDescription] = useState("");
  const updateDescriptionMutation = wrpc["app.updateDescription"].useMutation();

  const updateDescription = useCallback(() => {
    if (!newDescription || !app) {
      return;
    }
    updateDescriptionMutation.mutate(
      {
        appId: app.appId,
        description: newDescription,
      },
      {
        onSuccess: () => {
          showNotification("Description updated");
        },
      },
    );
  }, [newDescription]);

  return (
    <div className="flex gap-2">
      <textarea
        className={clsx(
          "w-full",
          "p-2 rounded-md text-xs",
          "resize-none",
          theme.bgInput,
          theme.borderInput,
          theme.textInput,
          theme.focusInput,
          loading && "cursor-not-allowed opacity-50",
        )}
        placeholder="App description..."
        value={newDescription || app?.description || ""}
        onChange={(e) => {
          const value = e.target.value;
          if (value.length > MAX_DESCRIPTION_LENGTH) {
            return;
          }
          setNewDescription(value);
        }}
        disabled={loading}
      />
      <div>
        <Button
          onClick={() => {
            updateDescription();
          }}
          disabled={
            loading ||
            newDescription === app?.description ||
            newDescription === ""
          }
          className="truncate"
        >
          Save
        </Button>
      </div>
    </div>
  );
};
