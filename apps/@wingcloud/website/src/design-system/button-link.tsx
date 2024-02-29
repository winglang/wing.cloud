import clsx from "clsx";
import { type PropsWithChildren, type ForwardRefExoticComponent } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "./theme-provider.js";

interface ButtonLinkProps {
  id?: string;
  primary?: boolean;
  label?: string;
  title?: string;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
  icon?: ForwardRefExoticComponent<any>;
  small?: boolean;
  transparent?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  to: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

export const ButtonLink = ({
  id,
  primary = false,
  disabled = false,
  title,
  label,
  className,
  iconClassName,
  icon: Icon,
  children,
  small = false,
  transparent = false,
  onClick,
  to,
  target = "_self",
}: PropsWithChildren<ButtonLinkProps>) => {
  const { theme } = useTheme();

  return (
    <Link
      id={id}
      to={to}
      target={target}
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
          !transparent && [theme.bgInput, theme.bgInputHover, theme.textInput],
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
      aria-disabled={disabled}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
        }
        onClick?.(event);
      }}
    >
      {Icon && (
        <Icon
          className={clsx(
            label && "-ml-0.5",
            "size-4",
            theme.text2,
            iconClassName,
          )}
        />
      )}
      {label}
      {children}
    </Link>
  );
};
