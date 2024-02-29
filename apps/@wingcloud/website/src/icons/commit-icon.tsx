import { forwardRef } from "react";

type CommitIconProps = React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
  title?: string;
  titleId?: string;
} & React.RefAttributes<SVGSVGElement>;

export const CommitIcon = forwardRef<SVGSVGElement, CommitIconProps>(
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
          d="M16 12a4 4 0 100 8 4 4 0 000-8zm-5.917 3a6.002 6.002 0 0111.834 0H29v2h-7.083a6.002 6.002 0 01-11.834 0H3v-2h7.083z"
        />
      </svg>
    );
  },
);
