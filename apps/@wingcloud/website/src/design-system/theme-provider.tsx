import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Theme {
  bg1: string;
  bg2: string;
  bg3: string;
  bg4: string;
  bgInput: string;
  bgInputHover: string;
  bg2Hover: string;
  bg3Hover: string;
  bg4Hover: string;
  border3: string;
  border4: string;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  text1Hover: string;
  text2Hover: string;
  text3Hover: string;
  text4Hover: string;
  text4GroupHover: string;
  textFocus: string;
  textInput: string;
  focusInput: string;
  borderInput: string;
  focusWithin: string;
  scrollbar: string;
}

export type Mode = "dark" | "light" | "auto";

const localStorageThemeKey = "console-theme";

export const USE_EXTERNAL_THEME_COLOR = "use-external-theme-color";

export const DefaultTheme: Theme = {
  bg1: "bg-gray-300 dark:bg-gray-800",
  bg2: "bg-gray-200 dark:bg-gray-800",
  bg3: "bg-gray-100 dark:bg-gray-700",
  bg4: "bg-white dark:bg-gray-800",
  bgInput: "bg-white dark:bg-gray-800",
  bgInputHover: "hover:bg-gray-50 dark:hover:bg-gray-750",
  bg2Hover: "hover:bg-gray-200 dark:hover:bg-gray-750",
  bg3Hover: "hover:bg-gray-150 dark:hover:bg-gray-650",
  bg4Hover: "hover:bg-gray-50 dark:hover:bg-gray-500",
  border3: "border-gray-300 dark:border-gray-900",
  border4: "border-gray-200 dark:border-gray-800",
  text1: "text-gray-700 dark:text-gray-250",
  text2: "text-gray-600 dark:text-gray-300",
  text3: "text-gray-500 dark:text-gray-350",
  text4: "text-gray-450 dark:text-gray-400",
  text1Hover: "hover:text-gray-750 dark:hover:text-gray-200",
  text2Hover: "hover:text-gray-650 dark:hover:text-gray-250",
  text3Hover: "hover:text-gray-550 dark:hover:text-gray-350",
  text4Hover: "hover:text-gray-500 dark:hover:text-gray-300",
  text4GroupHover: "group-hover:text-gray-550 dark:group-hover:text-gray-350",
  textFocus: "text-sky-700 dark:text-sky-300",
  textInput:
    "text-gray-900 placeholder:text-gray-500 dark:text-gray-300 dark:placeholder:text-gray-500",
  focusInput:
    "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
  borderInput: "border-gray-200 dark:border-gray-800",
  focusWithin:
    "focus-within:ring-2 focus-within:ring-sky-500/50 focus-within:border-sky-500 outline-none",
  scrollbar:
    "scrollbar hover:scrollbar-bg-gray-500/10 hover:scrollbar-thumb-gray-700/30 scrollbar-thumb-hover-gray-700/40 scrollbar-thumb-active-gray-700/60 dark:hover:scrollbar-bg-gray-400/10 dark:hover:scrollbar-thumb-gray-400/30 dark:scrollbar-thumb-hover-gray-400/40 dark:scrollbar-thumb-active-gray-400/60",
};

export interface ThemeProviderProps {
  theme: Theme;
  mode: Mode;
  setThemeMode?: (mode: Mode) => void;
  mediaTheme?: Mode;
}

const setModeInLocalStorage = (mode: Mode) => {
  localStorage.setItem(localStorageThemeKey, JSON.stringify({ mode: mode }));
};

const getThemeModeFromLocalStorage = () => {
  const localThemeObject = localStorage.getItem(localStorageThemeKey);
  if (!localThemeObject) {
    return;
  }
  return JSON.parse(localThemeObject)?.mode as Mode;
};

const updateDomClassList = (mode: Mode) => {
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

const getMediaThemeMode = () => {
  return window?.matchMedia("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
};

const getThemeMode = (): Mode => {
  return getThemeModeFromLocalStorage() ?? getMediaThemeMode();
};

const setThemeMode = (selectedMode?: Mode) => {
  const mediaTheme = getMediaThemeMode();
  if (selectedMode) {
    setModeInLocalStorage(selectedMode);
    updateDomClassList(selectedMode === "auto" ? mediaTheme : selectedMode);
    return;
  }
  const localThemeObject = getThemeMode();
  if (!localThemeObject) {
    updateDomClassList(mediaTheme);
    return;
  }
  const mode = localThemeObject === "auto" ? mediaTheme : localThemeObject;
  return updateDomClassList(mode);
};

const ThemeContext = createContext<ThemeProviderProps>({
  theme: DefaultTheme,
  mode: getThemeMode(),
  setThemeMode,
});

export const ThemeProvider = ({
  theme,
  mode,
  children,
}: PropsWithChildren<ThemeProviderProps>) => {
  const [currentMode, setCurrentMode] = useState<Mode>(mode ?? getThemeMode());

  const onSetThemeMode = useCallback((mode: Mode) => {
    setCurrentMode(mode);
    setThemeMode(mode);
  }, []);

  setThemeMode(mode);

  useEffect(() => {
    const reloadThemeMode = () => {
      setThemeMode();
    };
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", reloadThemeMode);

    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", reloadThemeMode);
    };
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: theme ?? DefaultTheme,
        mode: currentMode,
        mediaTheme: getMediaThemeMode(),
        setThemeMode: onSetThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
