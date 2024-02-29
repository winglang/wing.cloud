import { forwardRef } from "react";

type PullRequestIconProps = React.PropsWithoutRef<
  React.SVGProps<SVGSVGElement>
> & {
  title?: string;
  titleId?: string;
} & React.RefAttributes<SVGSVGElement>;

export const PullRequestIcon = forwardRef<SVGSVGElement, PullRequestIconProps>(
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
          fillRule="evenodd"
          fill="currentColor"
          d="M23 25.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm1.5-4.389V10a3 3 0 00-3-3h-4.085l2.792 2.793-1.414 1.414-4.5-4.5L13.586 6l.707-.707 4.5-4.5 1.414 1.414L17.414 5H21.5a5 5 0 015 5v11.112a4.502 4.502 0 01-1 8.888 4.5 4.5 0 01-1-8.889zM4 25.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-2 0a4.502 4.502 0 013.5-4.389V10.89A4.502 4.502 0 016.5 2a4.5 4.5 0 011 8.888v10.224A4.502 4.502 0 016.5 30 4.5 4.5 0 012 25.5zM6.5 9a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
        />
      </svg>
    );
  },
);
