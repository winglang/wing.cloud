import { forwardRef } from "react";

type BranchIconProps = React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
  title?: string;
  titleId?: string;
} & React.RefAttributes<SVGSVGElement>;

export const BranchIcon = forwardRef<SVGSVGElement, BranchIconProps>(
  ({ title, titleId, ...props }, svgRef) => {
    return (
      <svg
        width="800"
        height="800"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ rotate: "-90deg" }}
        ref={svgRef}
        aria-labelledby={titleId}
        {...props}
      >
        {title && <title id={titleId}>{title}</title>}

        <path
          fill="currentColor"
          d="M26 18a3.995 3.995 0 0 0-3.858 3H18a3.003 3.003 0 0 1-3-3v-4a4.951 4.951 0 0 0-1.026-3h8.168a4 4 0 1 0 0-2H9.858a4 4 0 1 0 0 2H10a3.003 3.003 0 0 1 3 3v4a5.006 5.006 0 0 0 5 5h4.142A3.994 3.994 0 1 0 26 18Zm0-10a2 2 0 1 1-2 2 2.002 2.002 0 0 1 2-2ZM6 12a2 2 0 1 1 2-2 2.002 2.002 0 0 1-2 2Zm20 12a2 2 0 1 1 2-2 2.003 2.003 0 0 1-2 2Z"
        />
        <path d="M0 0h32v32H0z" data-name="&lt;Transparent Rectangle&gt;" />
      </svg>
    );
  },
);
