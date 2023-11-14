import { ConnectRepoSettings } from "./connect-repo-settings.js";

export type ConfigurationType = "connect";

export interface AppConfigurationProps {
  type?: ConfigurationType;
  onAppCreated: () => void;
  onCancel: () => void;
  onError: (error: Error) => void;
}

export const AppConfiguration = ({
  type,
  onAppCreated,
  onCancel,
  onError,
}: AppConfigurationProps) => {
  return (
    <>
      {type === "connect" && (
        <ConnectRepoSettings
          onAppCreated={onAppCreated}
          onCancel={onCancel}
          onError={onError}
        />
      )}
    </>
  );
};
