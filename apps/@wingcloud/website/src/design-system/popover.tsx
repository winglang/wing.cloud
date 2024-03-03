import { Popover as HeadlessPopover, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useEffect, useState, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";

import { useTheme } from "./theme-provider.js";

export interface PopoverProps {
  button: React.ReactNode;
  classNames?: string;
}

export default function Popover({
  button,
  classNames,
  children,
}: PropsWithChildren<PopoverProps>) {
  const { theme } = useTheme();

  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    // eslint-disable-next-line unicorn/no-null
    null,
  );
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(
    // eslint-disable-next-line unicorn/no-null
    null,
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    strategy: "fixed",
  });

  const [root] = useState(() => document.createElement("div"));
  useEffect(() => {
    document.body.append(root);
    return () => root.remove();
  }, [root]);

  return (
    <HeadlessPopover className="relative">
      {({ open }) => (
        <>
          <HeadlessPopover.Button
            className={classNames}
            ref={setReferenceElement}
          >
            {button}
          </HeadlessPopover.Button>
          {createPortal(
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                ref={setPopperElement}
                className="z-50"
                style={styles["popper"]}
                {...attributes["popper"]}
              >
                <HeadlessPopover.Panel
                  className={clsx(
                    "absolute z-20 mt-3 transform px-4 right-0",
                    theme.bgInput,
                    "border shadow-lg p-4 rounded-md",
                    theme.borderInput,
                  )}
                >
                  {children}
                </HeadlessPopover.Panel>
              </div>
            </Transition>,
            root,
          )}
        </>
      )}
    </HeadlessPopover>
  );
}
