import { ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { CommandLineIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";

import { Menu } from "../../../../design-system/menu.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { MenuIcon } from "../../../../icons/menu-icon.js";
import { STARTING_STATUS, type Environment } from "../../../../utils/wrpc.js";

import {
  RedeployEnvironmentModal,
  VALID_REDEPLOY_STATUS,
} from "./redeploy-environment-modal.js";

export const EnvironmentMenu = ({
  owner,
  appName,
  environment,
}: {
  owner: string;
  appName: string;
  environment: Environment;
}) => {
  const { theme } = useTheme();

  const redeployLabel = useMemo(() => {
    if (STARTING_STATUS.includes(environment.status)) {
      return "Deploying...";
    }
    return "Redeploy";
  }, [environment.status]);

  const [showRestartModal, setShowRestartModal] = useState(false);

  return (
    <>
      <Menu
        btnClassName={clsx(theme.bgInputHover, "rounded-sm")}
        icon={
          <MenuIcon
            className={clsx("size-6 transition-all p-1", theme.text2)}
          />
        }
        items={[
          {
            icon: (
              <ArrowPathIcon
                className={clsx(
                  "size-4",
                  STARTING_STATUS.includes(environment.status) &&
                    "animate-spin",
                )}
              />
            ),
            disabled: !VALID_REDEPLOY_STATUS.includes(environment.status),
            label: redeployLabel,
            onClick: () => setShowRestartModal(true),
          },
          {
            type: "separator",
          },
          {
            icon: <DocumentTextIcon className="size-4" />,
            label: "Logs",
            link: `/${owner}/${appName}/logs/${environment.branch}`,
          },
          {
            label: "Console",
            icon: <CommandLineIcon className="size-4" />,
            disabled: environment.status !== "running",
            link: `/${owner}/${appName}/console/${environment.branch}`,
          },
        ]}
      />
      <RedeployEnvironmentModal
        owner={owner}
        appName={appName}
        branch={environment.branch}
        show={showRestartModal}
        onClose={() => setShowRestartModal(false)}
      />
    </>
  );
};
