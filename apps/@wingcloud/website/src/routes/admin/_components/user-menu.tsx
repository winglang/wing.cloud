import {
  ExclamationCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserGroupIcon,
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
import { RequireEarlyAccessCodeModal } from "./require-early-access-code-modal.js";
import { SetEarlyAccessModal } from "./set-early-access-modal.js";

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
  const [showEarlyAccessModal, setShowEarlyAccessModal] = useState(false);
  const [showRequireEarlyAccessCodeModal, setShowRequireEarlyAccessCodeModal] =
    useState(false);

  return (
    <>
      <Menu
        btnClassName={clsx(
          theme.text3Hover,
          "rounded-sm p-1 hover:bg-gray-100 transition-all",
        )}
        icon={<MenuIcon className={clsx("size-4", theme.text3)} />}
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
          {
            icon: <UserGroupIcon className="size-4" />,
            label: user.isEarlyAccessUser
              ? "Set as 'regular' user"
              : "Set as 'early access' user",
            onClick: () => setShowEarlyAccessModal(true),
          },
          {
            icon:
              user.isEarlyAccessUser && user.isEarlyAccessCodeRequired ? (
                <LockOpenIcon className="size-4" />
              ) : (
                <LockClosedIcon className="size-4" />
              ),
            label:
              user.isEarlyAccessUser && user.isEarlyAccessCodeRequired
                ? "Remove early access code"
                : "Require early access code",
            onClick: () => setShowRequireEarlyAccessCodeModal(true),
            disabled: !user.isEarlyAccessUser,
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
      <SetEarlyAccessModal
        user={user}
        show={showEarlyAccessModal}
        onClose={(success) => {
          setShowEarlyAccessModal(false);
          onClose?.(success);
        }}
      />
      <RequireEarlyAccessCodeModal
        user={user}
        show={showRequireEarlyAccessCodeModal}
        onClose={(success) => {
          setShowRequireEarlyAccessCodeModal(false);
          onClose?.(success);
        }}
      />
    </>
  );
};
