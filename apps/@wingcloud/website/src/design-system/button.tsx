import clsx from "clsx";
import {
  PropsWithChildren,
  forwardRef,
  type ForwardRefExoticComponent,
} from "react";

import { useTheme } from "./theme-provider.js";

interface ButtonProps {
  id?: string;
  primary?: boolean;
  label?: string;
  title?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
  icon?: ForwardRefExoticComponent<any>;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  small?: boolean;
  transparent?: boolean;
}

export const Button = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<ButtonProps>
>(
  (
    {
      id,
      primary = false,
      disabled = false,
      title,
      label,
      type = "button",
      className,
      iconClassName,
      onClick,
      icon: Icon,
      children,
      small = false,
      transparent = false,
    },
    ref,
  ) => {
    const { theme } = useTheme();

    return (
      <button
        id={id}
        ref={ref}
        type={type}
        className={clsx(
          "whitespace-nowrap",
          "inline-flex gap-2 items-center text-xs font-medium outline-none rounded-md",
          theme.focusVisible,
          primary &&
            !transparent && [
              "text-white",
              "bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600",
            ],
          !primary &&
            !transparent && [
              theme.bgInput,
              theme.bgInputHover,
              theme.textInput,
            ],
          transparent && [theme.bgInputHover, theme.textInput],
          !transparent && "border shadow-sm",
          {
            [theme.borderInput]: !primary,
            "border-sky-700": primary,
            "px-2.5": label || children,
            "py-1.5": !small,
            "py-1": small,
            "cursor-not-allowed opacity-50": disabled,
          },
          className,
        )}
        title={title}
        disabled={disabled}
        onClick={onClick}
      >
        {Icon && (
          <Icon
            className={clsx(label && "-ml-0.5", "h-4 w-4", iconClassName)}
          />
        )}
        {label}
        {children}
      </button>
    );
  },
);
