import { forwardRef } from "react";

type BranchIconProps = React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
  title?: string;
  titleId?: string;
} & React.RefAttributes<SVGSVGElement>;

export const BranchIcon = forwardRef<SVGSVGElement, BranchIconProps>(
  ({ title, titleId, ...props }, svgRef) => {
    return (
      <svg
        viewBox="0 0 32 32"
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
          d="M23.5 4a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM19 6.5a4.5 4.5 0 115.5 4.389V13a5 5 0 01-5 5h-7a3 3 0 00-3 3v.111A4.502 4.502 0 018.5 30a4.5 4.5 0 01-1-8.889V10.89A4.502 4.502 0 018.5 2a4.5 4.5 0 011 8.889v6.11c.836-.627 1.874-.999 3-.999h7a3 3 0 003-3v-2.111A4.502 4.502 0 0119 6.5zm-8 19A2.5 2.5 0 008.512 23h-.024A2.5 2.5 0 1011 25.5zm-5-19a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"
        />
      </svg>
    );
  },
);
