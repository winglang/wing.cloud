import { useEffect, useMemo, useState } from "react";

import { ConfirmationModal } from "../../../components/confirmation-modal.js";
import { useNotifications } from "../../../design-system/notification.js";
import { wrpc, type User } from "../../../utils/wrpc.js";

export interface RequireEarlyAccessCodeModalProps {
  user: User;
  show: boolean;
  onClose: (value: boolean) => void;
}

export const RequireEarlyAccessCodeModal = ({
  user,
  show,
  onClose,
}: RequireEarlyAccessCodeModalProps) => {
  const { showNotification } = useNotifications();
  const [disabled, setDisabled] = useState(false);

  const setEarlyAccessUser = wrpc["admin.setEarlyAccessUser"].useMutation({
    onMutate() {
      setDisabled(true);
    },
    onSuccess() {
      showNotification(
        `${user.username} ${
          user.isEarlyAccessCodeRequired ? "no longer" : ""
        } requires an early access code to sign in.`,
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
        be
        {user.isEarlyAccessCodeRequired ? " no longer" : ""} required to use an{" "}
        <span className="bg-slate-200 text-slate-700 px-1 rounded">
          early access code
        </span>{" "}
        to sign in.
      </p>
    ),
    [user.isEarlyAccessUser, user.username],
  );

  return (
    <ConfirmationModal
      type="warning"
      show={show}
      isIdle={setEarlyAccessUser.isIdle}
      isPending={disabled}
      onClose={onClose}
      onConfirm={() =>
        setEarlyAccessUser.mutate({
          userId: user.id,
          isEarlyAccessUser: user.isEarlyAccessUser,
          isEarlyAccessCodeRequired: !user.isEarlyAccessCodeRequired,
        })
      }
      modalTitle={
        user.isEarlyAccessCodeRequired
          ? "Remove early access code"
          : "Require early access code"
      }
      modalBody={dialogBody}
      confirmButtonText="Change"
      confirmButtonTextPending="Processing..."
    />
  );
};
