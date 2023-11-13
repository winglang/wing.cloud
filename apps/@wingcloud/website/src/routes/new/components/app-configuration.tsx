import { ConnectRepoSettings } from "./connect-repo-settings.js";

export type ConfigurationType = "connect";

export interface AppConfigurationProps {
  type?: ConfigurationType;
  onCreateApp: () => void;
  onCancel: () => void;
  onError: (error: Error) => void;
}

export const AppConfiguration = ({
  type,
  onCreateApp,
  onCancel,
  onError,
}: AppConfigurationProps) => {
  return (
    <>
      {type === "connect" && (
        <ConnectRepoSettings
          onCreateApp={onCreateApp}
          onCancel={onCancel}
          onError={onError}
        />
      )}
    </>
  );
};
