import { useMemo, useState } from "react";

import { ConfirmationModal } from "../../../../components/confirmation-modal.js";
import { useNotifications } from "../../../../design-system/notification.js";
import { useQueryCache } from "../../../../utils/use-query-cache.js";
import { wrpc } from "../../../../utils/wrpc.js";

export interface RestartEnvironmentModalProps {
  owner: string;
  appName: string;
  branch: string;
  show: boolean;
  onClose: (value: boolean) => void;
}

export const RestartEnvironmentModal = ({
  owner,
  appName,
  branch,
  show,
  onClose,
}: RestartEnvironmentModalProps) => {
  const { showNotification } = useNotifications();
  const [disabled, setDisabled] = useState(false);

  const { restartEnvironmentStatus } = useQueryCache();

  const restartEnviornment = wrpc["app.environment.restart"].useMutation({
    onMutate() {
      setDisabled(true);
    },
    onSuccess() {
      showNotification(`Environment ${appName} restarted`, { type: "success" });
      restartEnvironmentStatus(branch);
      onClose(false);
      setDisabled(false);
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
        The Environment{" "}
        <span className="bg-slate-200 text-slate-700 px-1 rounded">
          {branch}
        </span>{" "}
        will be restarted. This action is irreversible and can not be undone.
      </p>
    ),
    [appName],
  );

  return (
    <ConfirmationModal
      show={show}
      isIdle={restartEnviornment.isIdle}
      isPending={disabled}
      onClose={onClose}
      onConfirm={() => restartEnviornment.mutate({ owner, appName, branch })}
      modalTitle={"Restart Environment"}
      modalBody={dialogBody}
      confirmButtonTextPending="Restarting..."
    />
  );
};
