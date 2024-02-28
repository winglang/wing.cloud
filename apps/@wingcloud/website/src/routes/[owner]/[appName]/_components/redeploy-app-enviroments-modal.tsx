import { useEffect, useMemo, useState } from "react";

import { ConfirmationModal } from "../../../../components/confirmation-modal.js";
import { useNotifications } from "../../../../design-system/notification.js";
import { useQueryCache } from "../../../../utils/use-query-cache.js";
import { wrpc } from "../../../../utils/wrpc.js";

export interface RedeployAppEnvironmentsModalProps {
  owner: string;
  appId: string;
  appName: string;
  show: boolean;
  onClose: (value: boolean) => void;
}

export const RedeployAppEnvironmentsModal = ({
  owner,
  appId,
  appName,
  show,
  onClose,
}: RedeployAppEnvironmentsModalProps) => {
  const { showNotification } = useNotifications();
  const [disabled, setDisabled] = useState(false);

  const { restartAppEnvironmentsStatus } = useQueryCache();

  const restartApp = wrpc["app.environment.restartAll"].useMutation({
    onMutate() {
      setDisabled(true);
    },
    onSuccess(data) {
      showNotification(`Redeploying "${appName}" environments`, {
        type: "success",
      });
      restartAppEnvironmentsStatus(appId);
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
        All of the enviroments in the{" "}
        <span className="bg-slate-200 text-slate-700 px-1 rounded">
          {appName}
        </span>{" "}
        application will be redeployed.
      </p>
    ),
    [appName],
  );

  return (
    <ConfirmationModal
      type="warning"
      show={show}
      isIdle={restartApp.isIdle}
      isPending={disabled}
      onClose={onClose}
      onConfirm={() => restartApp.mutate({ owner, appName })}
      modalTitle={"Redeploy all environments?"}
      modalBody={dialogBody}
      confirmButtonText="Redeploy all"
      confirmButtonTextPending="Redeploying..."
    />
  );
};
