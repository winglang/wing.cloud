import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";

export interface PopupWindowContext {
  openPopupWindow: (options: {
    url?: string;
    width?: number;
    height?: number;
    onClose?: () => void;
  }) => Window | null;
}

export const usePopupWindow = () => {
  const [popupWindow, setPopupWindow] = useState<Window>();

  const openPopupWindow = useCallback(
    ({
      url = "",
      width = 600,
      height = 720,
      onClose = () => {},
    }): Window | null => {
      const leftPosition = window.screen.width / 2 - (width / 2 + 10);
      const topPosition = window.screen.height / 2 - (height / 2 + 50);
      const newPopupWindow = window.open(
        url,
        "_blank",
        "status=no,height=" +
          height +
          ",width=" +
          width +
          ",resizable=yes,left=" +
          leftPosition +
          ",top=" +
          topPosition +
          ",screenX=" +
          leftPosition +
          ",screenY=" +
          topPosition +
          ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no",
      );

      setPopupWindow(newPopupWindow as Window);

      const interval = setInterval(() => {
        if (newPopupWindow?.closed) {
          clearInterval(interval);
          onClose();
        }
      }, 1000);

      return newPopupWindow;
    },
    [],
  );

  return openPopupWindow;
};

export const PopupWindowContext = createContext<PopupWindowContext>({
  openPopupWindow: (options: {
    url?: string;
    width?: number;
    height?: number;
    onClose?: () => void;
  }) => ({}) as Window,
});

export const PopupWindowProvider = ({ children }: PropsWithChildren) => {
  const openPopupWindow = usePopupWindow();

  // Prevent popup windows from loading Wing Cloud web app after reloading the page
  useEffect(() => {
    if (window.opener) {
      window.close();
    }
  }, []);

  return (
    <PopupWindowContext.Provider value={{ openPopupWindow }}>
      {children}
    </PopupWindowContext.Provider>
  );
};
