import clsx from "clsx";
import {
  type PropsWithChildren,
  forwardRef,
  type ForwardRefExoticComponent,
} from "react";

interface ButtonProps {
  id?: string;
  primary?: boolean;
  label?: string;
  title?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  icon?: ForwardRefExoticComponent<any>;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  small?: boolean;
  transparent?: boolean;
  dataTestid?: string;
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
      onClick,
      icon: Icon,
      children,
      small = false,
      transparent = false,
      dataTestid,
    },
    ref,
  ) => {
    return (
      <button
        id={id}
        ref={ref}
        type={type}
        className={clsx(
          "inline-flex gap-2 items-center text-xs font-medium outline-none rounded",
          "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
          primary &&
            !transparent && [
              "text-white",
              "bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600",
            ],
          !primary &&
            !transparent && [
              "bg-white dark:bg-slate-800",
              "hover:bg-slate-50 dark:hover:bg-slate-750",
              "text-slate-900 placeholder:text-slate-500 dark:text-slate-300 dark:placeholder:text-slate-500",
            ],
          transparent && [
            "hover:bg-slate-50 dark:hover:bg-slate-750",
            "text-slate-900 placeholder:text-slate-500 dark:text-slate-300 dark:placeholder:text-slate-500",
          ],
          !transparent && "border shadow-sm",
          {
            ["border-slate-300 dark:border-slate-900"]: !primary,
            "border-sky-700": primary,
            "px-2.5": label || children,
            "py-1.5": !small,
            "cursor-not-allowed opacity-50": disabled,
          },
          className,
        )}
        title={title}
        disabled={disabled}
        onClick={onClick}
        data-testid={dataTestid}
      >
        {Icon && <Icon className={clsx(label && "-ml-0.5", "h-4 w-4")} />}
        {label}
        {children}
      </button>
    );
  },
);
