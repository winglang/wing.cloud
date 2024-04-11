import { useEffect, useMemo, useState } from "react";

import { ConfirmationModal } from "../../../components/confirmation-modal.js";
import { useNotifications } from "../../../design-system/notification.js";
import { wrpc, type User } from "../../../utils/wrpc.js";

export interface SetEarlyAccessModalProps {
  user: User;
  show: boolean;
  onClose: (value: boolean) => void;
}

export const SetEarlyAccessModal = ({
  user,
  show,
  onClose,
}: SetEarlyAccessModalProps) => {
  const { showNotification } = useNotifications();
  const [disabled, setDisabled] = useState(false);

  const setAdminRole = wrpc["admin.setEarlyAccessUser"].useMutation({
    onMutate() {
      setDisabled(true);
    },
    onSuccess() {
      showNotification(
        `Changed ${user.username} user to ${
          user.isEarlyAccessUser ? "regular" : "early-access"
        }
        successfully.`,
        {
          type: "success",
        },
      );
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
        User <span className="text-slate-700 italic">{user.username}</span> will
        be set as
        {user.isEarlyAccessUser ? " a " : " an "}
        <span className="bg-slate-200 text-slate-700 px-1 rounded">
          {user.isEarlyAccessUser ? "regular" : "early-access"}
        </span>{" "}
        user.
      </p>
    ),
    [user.isEarlyAccessUser, user.username],
  );

  return (
    <ConfirmationModal
      type="warning"
      show={show}
      isIdle={setAdminRole.isIdle}
      isPending={disabled}
      onClose={onClose}
      onConfirm={() =>
        setAdminRole.mutate({
          userId: user.id,
          isEarlyAccessUser: !user.isEarlyAccessUser,
        })
      }
      modalTitle="Change user type"
      modalBody={dialogBody}
      confirmButtonText="Change"
      confirmButtonTextPending="Processing..."
    />
  );
};
