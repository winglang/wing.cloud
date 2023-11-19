import clsx from "clsx";
import { useState, useMemo } from "react";

import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { type App, type Secret } from "../../../utils/wrpc.js";

import { NewSecret } from "./new-secret.js";
import { SecretsListItem } from "./secrets-list-item.js";

export const SecretsList = ({
  app,
  secrets,
  loading,
}: {
  app: App;
  secrets: Secret[];
  loading: boolean;
}) => {
  const [updatingSecrets, setUpdatingSecrets] = useState(false);
  const { theme } = useTheme();
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

  return (
    <div className="flex flex-col bg-white rounded p-4 shadow gap-2">
      <div className={clsx("truncate", theme.text1)}>Secrets</div>
      <div className="flex flex-col gap-6">
        <NewSecret appId={app.appId} setUpdatingSecrets={setUpdatingSecrets} />
        <div className="w-full flex flex-col gap-2">
          {(loading || updatingSecrets) && (
            <SpinnerLoader size="sm" className="z-20" />
          )}
          {!loading &&
            groupedSecrets.map((group) => (
              <div className="w-full flex flex-col gap-2" key={group[0]}>
                <div className="capitalize">{group[0]}</div>
                {group[1].map((secret, index) => (
                  <SecretsListItem
                    key={index}
                    secret={secret}
                    setUpdatingSecrets={setUpdatingSecrets}
                  />
                ))}
              </div>
            ))}
        </div>
      </div>
      <hr className="h-px mt-2 mb-4 bg-gray-200 border-0 dark:bg-gray-700" />
      <span className={clsx("text-xs truncate", theme.text2)}>
        Learn more about{" "}
        <a
          className="text-blue-600"
          href="https://www.winglang.io/docs/standard-library/cloud/secret"
          target="_blank"
        >
          Wing Secrets
        </a>{" "}
      </span>
    </div>
  );
};
