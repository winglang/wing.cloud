import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ConfirmationModal } from "../../../../components/confirmation-modal.js";
import { useNotifications } from "../../../../design-system/notification.js";
import { useQueryCache } from "../../../../utils/use-query-cache.js";
import { wrpc } from "../../../../utils/wrpc.js";

export interface DeleteModalProps {
  owner: string;
  appName: string;
  show: boolean;
  onClose: (value: boolean) => void;
}

export const DeleteModal = ({
  owner,
  appName,
  show,
  onClose,
}: DeleteModalProps) => {
  const { showNotification } = useNotifications();

  const navigate = useNavigate();

  const { deleteAppItemFromAppList } = useQueryCache();
  const deleteApp = wrpc["app.delete"].useMutation({
    onSuccess() {
      showNotification(`App ${appName} deleted`, { type: "success" });
      deleteAppItemFromAppList(appName);
      navigate(`/${owner}`);
    },
    onError(error) {
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
        The App{" "}
        <span className="bg-slate-200 text-slate-700 px-1 rounded">
          {appName}
        </span>{" "}
        will be permanently deleted, including its preview and production
        environments. This action is irreversible and can not be undone.
      </p>
    ),
    [appName],
  );

  return (
    <ConfirmationModal
      show={show}
      isIdle={deleteApp.isIdle}
      isPending={deleteApp.isPending}
      onClose={onClose}
      onConfirm={() => deleteApp.mutate({ owner, appName })}
      modalTitle={"Delete App"}
      modalBody={dialogBody}
    />
  );
};
