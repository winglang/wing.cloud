import { ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { CommandLineIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Menu } from "../../../../design-system/menu.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { MenuIcon } from "../../../../icons/menu-icon.js";
import type { Environment } from "../../../../utils/wrpc.js";

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

  const navigate = useNavigate();

  const [showRestartModal, setShowRestartModal] = useState(false);

  return (
    <>
      <Menu
        btnClassName={clsx(theme.bgInputHover, "rounded-sm")}
        icon={
          <MenuIcon
            className={clsx("w-6 h-6", "transition-all", "p-1", theme.text2)}
          />
        }
        items={[
          {
            icon: <ArrowPathIcon className="size-4" />,
            disabled: !VALID_REDEPLOY_STATUS.includes(environment.status),
            label: "Redeploy",
            onClick: () => setShowRestartModal(true),
          },
          {
            type: "separator",
          },
          {
            label: "View Console",
            icon: <CommandLineIcon className="size-4" />,
            onClick: () => {
              navigate(`/${owner}/${appName}/${environment.branch}/console`);
            },
            disabled: environment.status !== "running",
          },
          {
            icon: <DocumentTextIcon className="size-4" />,
            label: "View logs",
            onClick: () => {
              window.location.href = `/${owner}/${appName}/${environment.branch}/logs}`;
            },
          },
        ]}
      />
      <RedeployEnvironmentModal
        owner={owner}
        appName={appName}
        branch={environment.branch}
        show={showRestartModal}
        onClose={setShowRestartModal}
      />
    </>
  );
};
