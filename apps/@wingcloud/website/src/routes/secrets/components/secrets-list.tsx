import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { type App, type Secret } from "../../../utils/wrpc.js";
import { SecretsListItem } from "./secrets-list-item.js";
import { NewSecret } from "./new-secret.js";

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
    <>
      <div className="flex flex-col gap-x-2 bg-white rounded p-4 shadow">
        <div className="flex flex-col text-slate-700 text-x truncate">
          <div className="flex flex-row items-center">
            <span>Secrets</span>
          </div>
        </div>
        <div className="flex">
          <NewSecret appId={app.appId} />
        </div>
        <div className="w-full flex flex-col mt-2">
          {loading &&<SpinnerLoader size="sm" className="z-20" />}
          {secrets.map((secret) => (
            <SecretsListItem
              key={secret.id}
              secret={secret}
            />
          ))}
        </div>
        <hr className="h-px my-4 bg-gray-200 border-0 dark:bg-gray-700" />
        <span className="text-slate-500 text-xs truncate">Learn more about <a className="text-blue-600" href="https://www.winglang.io/docs/standard-library/cloud/secret" target="_blank">Wing Secrets</a> </span>
      </div>
    </>
  );
};
