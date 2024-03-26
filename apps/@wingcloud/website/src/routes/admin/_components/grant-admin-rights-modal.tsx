import { useEffect, useMemo, useState } from "react";

import { ConfirmationModal } from "../../../components/confirmation-modal.js";
import { useNotifications } from "../../../design-system/notification.js";
import { wrpc, type User } from "../../../utils/wrpc.js";

export interface GrantAdminRightsModalProps {
  user: User;
  show: boolean;
  onClose: (value: boolean) => void;
}

export const GrantAdminRightsModal = ({
  user,
  show,
  onClose,
}: GrantAdminRightsModalProps) => {
  const { showNotification } = useNotifications();
  const [disabled, setDisabled] = useState(false);

  const setAdminRole = wrpc["admin.setAdminRole"].useMutation({
    onMutate() {
      setDisabled(true);
    },
    onSuccess() {
      const title = user.isAdmin ? "Revoked" : "Granted";
      showNotification(`${title} admin permissions to ${user.username}`, {
        type: "success",
      });
      onClose(true);
    },
    onError(error) {
      setDisabled(false);
      if (error instanceof Error) {
        showNotification(error.message, { type: "error" });
      } else {
        showNotification(`Unknown error: ${error}`, { type: "error" });
      }
      onClose(false);
    },
  });

  useEffect(() => {
    if (!show) {
      setTimeout(() => {
        setDisabled(false);
      }, 500);
    }
  }, [show]);

  const dialogBody = useMemo(
    () => (
      <p className="text-sm text-slate-500">
        Admin permissions will be{" "}
        <span className="bg-slate-200 text-slate-700 px-1 rounded">
          {user.isAdmin ? "revoked" : "granted"}
        </span>{" "}
        to <span className="text-slate-700 italic">{user.username}</span> user.
      </p>
    ),
    [user.isAdmin, user.username],
  );

  return (
    <ConfirmationModal
      type="warning"
      show={show}
      isIdle={setAdminRole.isIdle}
      isPending={disabled}
      onClose={onClose}
      onConfirm={() =>
        setAdminRole.mutate({ userId: user.id, isAdmin: !user.isAdmin })
      }
      modalTitle="Grant admin permissions"
      modalBody={dialogBody}
      confirmButtonText={user.isAdmin ? "Revoke" : "Grant"}
      confirmButtonTextPending="Processing..."
    />
  );
};
