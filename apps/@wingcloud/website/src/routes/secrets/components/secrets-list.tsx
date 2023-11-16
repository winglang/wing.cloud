import { SpinnerLoader } from "../../../components/spinner-loader.js";
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
  return (
    <div className="flex flex-col bg-white rounded p-4 shadow gap-2">
      <div className="text-slate-700 truncate">Secrets</div>
      <div className="flex flex-col gap-6">
        <NewSecret appId={app.appId} />
        <div className="w-full flex flex-col gap-2">
          {loading && <SpinnerLoader size="sm" className="z-20" />}
          {secrets.map((secret) => (
            <SecretsListItem key={secret.id} secret={secret} />
          ))}
        </div>
      </div>
      <hr className="h-px mt-2 mb-4 bg-gray-200 border-0 dark:bg-gray-700" />
      <span className="text-slate-500 text-xs truncate">
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
