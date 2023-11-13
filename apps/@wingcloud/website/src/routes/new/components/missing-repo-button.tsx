import clsx from "clsx";
import { useNavigate } from "react-router-dom";

import { useTheme } from "../../../design-system/theme-provider.js";
import { usePopupWindow } from "../../../utils/popup-window.js";

export const MissingRepoButton = ({ onClose }: { onClose: () => void }) => {
  const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

  const { theme } = useTheme();
  const navigate = useNavigate();
  const openPopupWindow = usePopupWindow();
  return (
    <div className="text-xs flex gap-1 items-center">
      <span className={clsx(theme.text1)}>Missing a repository?</span>
      <button
        className="text-sky-600"
        onClick={() =>
          openPopupWindow({
            url: `https://github.com/apps/${GITHUB_APP_NAME}/installations/select_target`,
            onClose: onClose,
          })
        }
      >
        Adjust GitHub App Permissions
      </button>
    </div>
  );
};
