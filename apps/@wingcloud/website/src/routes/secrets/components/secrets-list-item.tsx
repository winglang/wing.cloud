import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useState } from "react";

import { Button } from "../../../design-system/button.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { useTimeAgo } from "../../../utils/time.js";
import type { Secret } from "../../../utils/wrpc.js";

const EmptySecret = "•••••••••••••••";

export const SecretsListItem = ({
  secret,
  loading,
  onDecrypt,
  onDelete,
}: {
  secret: Secret;
  loading: boolean;
  onDecrypt: (secret: Secret) => Promise<string | undefined>;
  onDelete: (secret: Secret) => Promise<void>;
}) => {
  const { theme } = useTheme();
  const [secretValue, setSecretValue] = useState(EmptySecret);

  const decryptSecret = useCallback(async () => {
    const value = await onDecrypt(secret);
    if (value) {
      setSecretValue(value);
    }
  }, [secret?.id]);

  const deleteSecret = useCallback(async () => {
    await onDelete(secret);
  }, [secret?.id]);

  return (
    <div className="text-xs flex items-center gap-4">
      <LockClosedIcon className={clsx("w-5 h-5 rounded-full", theme.text2)} />

      <div className="flex flex-col gap-2 truncate w-1/2">
        <span className="text-xs space-x-2 truncate flex flex-grow">
          {secret.name}
        </span>
        <div
          className={clsx("flex gap-x-1 items-center truncate", theme.text2)}
        >
          <span className={clsx("truncate", theme.text2)}>
            {secret.environmentType}
          </span>
        </div>
      </div>

      <div className="flex grow text-xs gap-x-2 truncate items-center justify-start">
        {secretValue === EmptySecret ? (
          <EyeIcon
            onClick={decryptSecret}
            className={clsx(
              "w-4 h-4",
              "rounded-full cursor-pointer shrink-0",
              theme.text2,
            )}
          />
        ) : (
          <EyeSlashIcon
            onClick={() => setSecretValue(EmptySecret)}
            className={clsx(
              "w-4 h-4",
              "rounded-full cursor-pointer",
              theme.text2,
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
