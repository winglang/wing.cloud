import { on } from "node:events";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ConfirmationModal } from "../../../components/confirmation-modal.js";
import { useNotifications } from "../../../design-system/notification.js";
import { wrpc } from "../../../utils/wrpc.js";

export interface DeleteEarlyAccessModalProps {
  email: string;
  show: boolean;
  onClose: (value: boolean) => void;
}

export const DeleteEarlyAccessModal = ({
  email,
  show,
  onClose,
}: DeleteEarlyAccessModalProps) => {
  const { showNotification } = useNotifications();
  const [disabled, setDisabled] = useState(false);

  const navigate = useNavigate();

  const deleteEarlyAccess = wrpc["admin.earlyAccess.delete"].useMutation({
    onMutate() {
      setDisabled(true);
    },
    onSuccess() {
      showNotification(`User "${email}" removed from early access list`, {
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

  const dialogBody = useMemo(
    () => (
      <p className="text-sm text-slate-500">
        The Early Access for{" "}
        <span className="bg-slate-200 text-slate-700 px-1 rounded">
          {email}
        </span>{" "}
        will be deleted.
      </p>
    ),
    [email],
  );

  return (
    <ConfirmationModal
      show={show}
      isIdle={deleteEarlyAccess.isIdle}
      isPending={disabled}
      onClose={onClose}
      onConfirm={() => deleteEarlyAccess.mutate({ email })}
      modalTitle={"Delete"}
      modalBody={dialogBody}
      confirmButtonTextPending="Deleting..."
    />
  );
};
