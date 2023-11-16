import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { Button } from "../../../design-system/button.js";
import { useNotifications } from "../../../design-system/notification.js";
import { useTimeAgo } from "../../../utils/time.js";
import { wrpc } from "../../../utils/wrpc.js";
import type { Secret } from "../../../utils/wrpc.js";

const EmptySecret = "•••••••••••••••";

export const SecretsListItem = ({ secret }: { secret: Secret }) => {
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [secretValue, setSecretValue] = useState(EmptySecret);

  const decryptSecretMutation = wrpc["app.decryptSecret"].useMutation();

  const decryptSecret = useCallback(async () => {
    try {
      setLoading(true);
      const { value } = await decryptSecretMutation.mutateAsync({
        appId: secret.appId,
        environmentType: secret.environmentType,
        secretId: secret.id,
      });
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
      await deleteSecretMutation.mutateAsync({
        appId: secret.appId,
        environmentType: secret.environmentType,
        secretId: secret.id,
      });
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
    <div className="text-xs flex truncate items-center gap-4">
      <LockClosedIcon
        className={clsx("w-5 h-5 text-slate-500", "rounded-full")}
      />

      <div className="flex flex-col gap-2 truncate w-1/3">
        <span className="text-xs space-x-2 truncate flex flex-grow">
          {secret.name}
        </span>
        <div className="text-slate-600 flex gap-x-1 items-center truncate">
          <span className="text-slate-500 truncate">
            {secret.environmentType}
          </span>
          <span className="text-slate-400 truncate">updated {updatedAt}</span>
        </div>
      </div>

      <div className="flex grow text-xs gap-x-2 truncate items-center justify-center">
        {secretValue === EmptySecret ? (
          <EyeIcon
            onClick={decryptSecret}
            className={clsx(
              "w-4 h-4 text-slate-500",
              "rounded-full cursor-pointer shrink-0",
            )}
          />
        ) : (
          <EyeSlashIcon
            onClick={() => setSecretValue(EmptySecret)}
            className={clsx(
              "w-4 h-4 text-slate-500",
              "rounded-full cursor-pointer",
            )}
          />
        )}
        <span className="truncate">{secretValue}</span>
      </div>

      <div className="flex gap-x-4 text-xs items-center justify-end">
        <div>
          <Button
            onClick={deleteSecret}
            disabled={loading}
            className="truncate"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
