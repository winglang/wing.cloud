import clsx from "clsx";
import { forwardRef, type ForwardRefExoticComponent } from "react";

export interface InputProps {
  id?: string;
  name?: string;
  type: React.HTMLInputTypeAttribute;
  className?: string;
  containerClassName?: string;
  placeholder?: string;
  value?: string;
  readOnly?: boolean;
  disabled?: boolean;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  leftIcon?: ForwardRefExoticComponent<any>;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { leftIcon: LeftIcon, className, containerClassName, disabled, ...props },
    ref,
  ) => {
    return (
      <div className={clsx("relative rounded-md", containerClassName)}>
        {LeftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
            <LeftIcon
              className={clsx("h-4 w-4", "text-slate-500 dark:text-slate-400")}
              aria-hidden="true"
            />
          </div>
        )}
        <input
          ref={ref}
          {...props}
          disabled={disabled}
          className={clsx(
            "border-slate-300 dark:border-slate-900",
            "inline-flex gap-2 items-center px-2.5 py-1.5 border text-xs rounded-md",
            "outline-none",
            "shadow-inner",
            LeftIcon && "pl-7",
            disabled && [
              "bg-slate-100 dark:bg-slate-700",
              "text-slate-500 dark:text-slate-400",
            ],
            !disabled && [
              "bg-white dark:bg-slate-800",
              "text-slate-900 placeholder:text-slate-500 dark:text-slate-300 dark:placeholder:text-slate-500",
              "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
            ],
            className,
          )}
        />
      </div>
    );
  },
);
