import { forwardRef } from "react";

type BranchIconProps = React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
  title?: string;
  titleId?: string;
} & React.RefAttributes<SVGSVGElement>;

export const BranchIcon = forwardRef<SVGSVGElement, BranchIconProps>(
  ({ title, titleId, ...props }, svgRef) => {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ref={svgRef}
        aria-labelledby={titleId}
        {...props}
      >
        {title && <title id={titleId}>{title}</title>}

        <path
          fill="currentColor"
          d="M37.1 15.14a3.39 3.39 0 1 0-4.32 3.23c-.33 5.11-6.63 5.53-8.6 5.53a10.42 10.42 0 0 0-8.7 4.81V15.85a3.39 3.39 0 1 0-1.65 0v16a.41.41 0 0 1 0 .09v1.83a3.39 3.39 0 1 0 1.65 0v-1.31c.09-.28 2.29-6.76 8.66-6.76 4.92 0 10.15-1.94 10.41-7.32a3.39 3.39 0 0 0 2.55-3.24Zm-24.17-2.56a1.73 1.73 0 1 1 1.73 1.73 1.72 1.72 0 0 1-1.73-1.73ZM16.38 37a1.73 1.73 0 1 1-1.72-1.72A1.73 1.73 0 0 1 16.38 37Zm17.33-20.14a1.73 1.73 0 1 1 1.73-1.72 1.72 1.72 0 0 1-1.73 1.72Z"
        />
      </svg>
    );
  },
);
