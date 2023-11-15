import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { useNotifications } from "../../../design-system/notification.js";
import { Button } from "../../../design-system/button.js";
import { useTimeAgo } from "../../../utils/time.js";
import { wrpc } from "../../../utils/wrpc.js";
import type { Secret } from "../../../utils/wrpc.js";

const EmptySecret = "•••••••••••••••";

export const SecretsListItem = ({
  secret,
}: {
  secret: Secret;
}) => {
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [secretValue, setSecretValue] = useState(EmptySecret);

  const decryptSecretMutation = wrpc["app.decryptSecret"].useMutation();

  const decryptSecret = useCallback(async () => {
    try {
      setLoading(true);
      const { value } = await decryptSecretMutation.mutateAsync({ appId: secret.appId, environmentType: secret.environmentType, secretId: secret.id }); 
      setSecretValue(value);
    } catch (error) {
      if (error instanceof Error) {
        showNotification("Failed to retrieve secret value", {
          body: error.message,
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [secret?.id, decryptSecretMutation]);

  const deleteSecretMutation = wrpc["app.deleteSecret"].useMutation();

  const deleteSecret = useCallback(async () => {
    try {
      setLoading(true);
      await deleteSecretMutation.mutateAsync({ appId: secret.appId, environmentType: secret.environmentType, secretId: secret.id });
      
    } catch (error) {
      if (error instanceof Error) {
        showNotification("Failed to delete secret", {
          body: error.message,
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [secret?.id, deleteSecretMutation]);

  const updatedAt = useTimeAgo(secret.updatedAt);

  return (
    <div
      className={clsx(
        "bg-white rounded p-4 text-left w-full block",
        "shadow hover:shadow-md transition-all",
      )}
    >
      <div className="flex items-center gap-x-4">
        <div className="relative">
          <LockClosedIcon
            className={clsx(
              "w-8 h-8 text-slate-500",
              "rounded-full",
            )}
          />
          <div
            title={secret.name}
            className={clsx(
              "absolute -top-1.5 -right-1.5",
              "w-2.5 h-2.5",
              "rounded-full",
            )}
          />
        </div>

        <div className="flex justify-between items-center truncate grow">
          <div className="text-xs space-y-2 truncate">
            <span className="text-sm space-x-2">{secret.name}</span>
            <div className="truncate flex gap-x-5">
              <div className="text-slate-600 flex gap-x-1 items-center">
                <span className="text-slate-500 truncate items-center flex">
                  {secret.environmentType}
                </span>
                <span className="text-slate-400 truncate items-center flex">
                  updated {updatedAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-row text-xs space-y-2 truncate">
            {secretValue === EmptySecret ? <EyeIcon onClick={decryptSecret} className={clsx(
              "w-4 h-4 text-slate-500",
              "rounded-full mr-2 cursor-pointer",
            )} /> : <EyeSlashIcon onClick={() => setSecretValue(EmptySecret)} className={clsx(
              "w-4 h-4 text-slate-500",
              "rounded-full mr-2 cursor-pointer",
            )} />}
            {secretValue}
          </div>

          <div className="flex gap-x-4 text-xs items-center justify-end">
            <div>
              <Button onClick={deleteSecret} disabled={loading} className="truncate">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
