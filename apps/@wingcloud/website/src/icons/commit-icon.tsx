import { forwardRef } from "react";

type CommitIconProps = React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
  title?: string;
  titleId?: string;
} & React.RefAttributes<SVGSVGElement>;

export const CommitIcon = forwardRef<SVGSVGElement, CommitIconProps>(
  ({ title, titleId, ...props }, svgRef) => {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ref={svgRef}
        aria-labelledby={titleId}
        {...props}
      >
        {title && <title id={titleId}>{title}</title>}

        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"
          clipRule="evenodd"
        />
      </svg>
    );
  },
);
