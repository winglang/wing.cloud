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
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ref={svgRef}
        aria-labelledby={titleId}
        {...props}
      >
        {title && <title id={titleId}>{title}</title>}

        <circle
          cx="160"
          cy="96"
          r="48"
          style={{
            stroke: "currentColor",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "32px",
          }}
        />
        <circle
          cx="160"
          cy="416"
          r="48"
          style={{
            stroke: "currentColor",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "32px",
          }}
        />
        <path
          d="M160 368V144"
          style={{
            stroke: "currentColor",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "32px",
          }}
        />
        <circle
          cx="352"
          cy="160"
          r="48"
          style={{
            stroke: "currentColor",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "32px",
          }}
        />
        <path
          d="M352 208c0 128-192 48-192 160"
          style={{
            stroke: "currentColor",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "32px",
          }}
        />
      </svg>
    );
  },
);
