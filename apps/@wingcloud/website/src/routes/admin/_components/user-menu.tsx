import {
  ExclamationCircleIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useContext, useState } from "react";

import { AuthDataProviderContext } from "../../../data-store/auth-data-provider.js";
import { Menu } from "../../../design-system/menu.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { MenuIcon } from "../../../icons/menu-icon.js";
import { type User } from "../../../utils/wrpc.js";

import { GrantAdminRightsModal } from "./grant-admin-rights-modal.js";

export const UserMenu = ({
  user,
  onClose,
}: {
  user: User;
  onClose?: (success: boolean) => void;
}) => {
  const { theme } = useTheme();
  const { user: currentUser } = useContext(AuthDataProviderContext);

  const [showAdminRightsModal, setShowAdminRightsModal] = useState(false);

  return (
    <>
      <Menu
        btnClassName={clsx(theme.text2Hover, "rounded-sm")}
        icon={
          <MenuIcon
            className={clsx("w-6 h-6", "transition-all", "p-1", theme.text2)}
          />
        }
        items={[
          {
            icon: <UserIcon className="size-4" />,
            label: "View profile",
            link: `/${user.username}`,
          },
          {
            type: "separator",
          },
          {
            icon: user.isAdmin ? (
              <XCircleIcon className="size-4" />
            ) : (
              <ExclamationCircleIcon className="size-4" />
            ),
            disabled: user.id === currentUser?.id,
            label: user.isAdmin ? "Revoke admin rights" : "Grant admin rights",
            onClick: () => setShowAdminRightsModal(true),
          },
        ]}
      />
      <GrantAdminRightsModal
        user={user}
        show={showAdminRightsModal}
        onClose={(success) => {
          setShowAdminRightsModal(false);
          onClose?.(success);
        }}
      />
    </>
  );
};
