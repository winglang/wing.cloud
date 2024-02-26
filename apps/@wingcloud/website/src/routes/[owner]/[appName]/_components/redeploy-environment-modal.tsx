import { useEffect, useMemo, useState } from "react";

import { ConfirmationModal } from "../../../../components/confirmation-modal.js";
import { useNotifications } from "../../../../design-system/notification.js";
import { useQueryCache } from "../../../../utils/use-query-cache.js";
import { wrpc, type EnvironmentStatus } from "../../../../utils/wrpc.js";

export interface RedeployEnvironmentModalProps {
  owner: string;
  appName: string;
  branch: string;
  show: boolean;
  onClose: (value: boolean) => void;
}

export const VALID_REDEPLOY_STATUS: EnvironmentStatus[] = [
  "running",
  "error",
  "stopped",
];

// create a new list

export const RedeployEnvironmentModal = ({
  owner,
  appName,
  branch,
  show,
  onClose,
}: RedeployEnvironmentModalProps) => {
  const { showNotification } = useNotifications();
  const [disabled, setDisabled] = useState(false);

  const { restartEnvironmentStatus } = useQueryCache();

  const restartEnviornment = wrpc["app.environment.restart"].useMutation({
    onMutate() {
      setDisabled(true);
    },
    onSuccess() {
      showNotification(`Redeploying "${branch}" Environment`, {
        type: "success",
      });
      restartEnvironmentStatus(branch);
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
      type="warning"
      show={show}
      isIdle={restartEnviornment.isIdle}
      isPending={disabled}
      onClose={onClose}
      onConfirm={() => restartEnviornment.mutate({ owner, appName, branch })}
      modalTitle={"Redeploy Environment"}
      modalBody={dialogBody}
      confirmButtonText="Redeploy"
      confirmButtonTextPending="Redeploying..."
    />
  );
};
