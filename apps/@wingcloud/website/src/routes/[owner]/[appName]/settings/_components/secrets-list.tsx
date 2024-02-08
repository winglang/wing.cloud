import { LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState, useMemo, useCallback } from "react";

import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useNotifications } from "../../../../../design-system/notification.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { type App, type Secret } from "../../../../../utils/wrpc.js";
import { wrpc } from "../../../../../utils/wrpc.js";
import type { EnvironmentType } from "../../../../../utils/wrpc.js";

import { NewSecret } from "./new-secret.js";
import { SecretsListItem } from "./secrets-list-item.js";

export const SecretsList = ({ appId }: { appId: string }) => {
  const { showNotification } = useNotifications();
  const { theme } = useTheme();
  const [updatingSecrets, setUpdatingSecrets] = useState(false);

  const secretsQuery = wrpc["app.listSecrets"].useQuery(
    {
      appId: appId || "",
    },
    {
      enabled: appId != undefined,
    },
  );

  const secrets = useMemo(() => {
    return secretsQuery.data?.secrets || [];
  }, [secretsQuery.data]);

  const createMutation = wrpc["app.createSecret"].useMutation();

  const onCreate = useCallback(
    async (name: string, value: string, environmentType: EnvironmentType) => {
      try {
        setUpdatingSecrets(true);
        await createMutation.mutateAsync({
          appId: appId,
          environmentType: environmentType!,
          name,
          value,
        });
        showNotification("Secret created");
      } catch (error) {
        if (error instanceof Error) {
          showNotification("Failed to create secret", {
            body: error.message,
            type: "error",
          });
        }
        throw error;
      } finally {
        setUpdatingSecrets(false);
      }
    },
    [createMutation],
  );

  const decryptSecretMutation = wrpc["app.decryptSecret"].useMutation();

  const onDecrypt = useCallback(
    async (secret: Secret) => {
      try {
        const { value } = await decryptSecretMutation.mutateAsync({
          appId: secret.appId,
          environmentType: secret.environmentType,
          secretId: secret.id,
        });
        return value;
      } catch (error) {
        if (error instanceof Error) {
          showNotification("Failed to retrieve secret value", {
            body: error.message,
            type: "error",
          });
        }
      }
    },
    [decryptSecretMutation],
  );

  const deleteSecretMutation = wrpc["app.deleteSecret"].useMutation();

  const onDelete = useCallback(
    async (secret: Secret) => {
      try {
        setUpdatingSecrets(true);
        await deleteSecretMutation.mutateAsync({
          appId: secret.appId,
          environmentType: secret.environmentType,
          secretId: secret.id,
        });
        showNotification("Secret deleted");
      } catch (error) {
        if (error instanceof Error) {
          showNotification("Failed to delete secret", {
            body: error.message,
            type: "error",
          });
        }
      } finally {
        setUpdatingSecrets(false);
      }
    },
    [deleteSecretMutation],
  );

  const groupedSecrets = useMemo(() => {
    const groups: Map<string, Secret[]> = new Map();
    for (let secret of secrets) {
      if (!groups.has(secret.environmentType)) {
        groups.set(secret.environmentType, []);
      }

      groups.get(secret.environmentType)?.push(secret);
    }

    return [...groups.entries()];
  }, [secrets]);

  const loading = secretsQuery.isLoading;

  return (
    <div
      className={clsx(
        "flex flex-col gap-2 rounded-md p-4 border",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <div className={clsx("truncate", theme.text1)}>Secrets</div>
      <div className="flex flex-col h-full">
        <NewSecret loading={updatingSecrets} onCreate={onCreate} />
        <div className="w-full flex flex-col gap-2 relative py-4">
          {(loading || updatingSecrets) && (
            <div className="flex items-center justify-center absolute inset-0 z-10">
              <SpinnerLoader size="sm" className="z-20" />
            </div>
          )}
          {!loading && !updatingSecrets && groupedSecrets.length === 0 && (
            <div className="text-xs flex flex-col truncate items-center gap-2">
              <LockClosedIcon
                className={clsx("w-5 h-5 rounded-full", theme.text2)}
              />
              <span className={clsx("font-bold", theme.text1)}>No secrets</span>
            </div>
          )}
          {!loading &&
            groupedSecrets.map((group) => (
              <div
                className={clsx(
                  "w-full flex flex-col gap-2",
                  updatingSecrets && "opacity-50",
                )}
                key={group[0]}
              >
                <div className={clsx("capitalize text-sm", theme.text1)}>
                  {group[0]}
                </div>
                {group[1].map((secret, index) => (
                  <SecretsListItem
                    key={`${secret.id}`}
                    secret={secret}
                    onDecrypt={onDecrypt}
                    onDelete={onDelete}
                    loading={updatingSecrets}
                  />
                ))}
              </div>
            ))}
        </div>
      </div>
      <hr className="h-px bg-slate-200 border-0 dark:bg-slate-700" />
      <span className={clsx("text-xs truncate", theme.text2)}>
        Learn more about{" "}
        <a
          className="text-blue-600"
          href="https://www.winglang.io/docs/standard-library/cloud/secret"
          target="_blank"
        >
          Secrets
        </a>{" "}
      </span>
    </div>
  );
};
