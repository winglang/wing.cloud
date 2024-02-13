import { forwardRef } from "react";

type ConsolePreviewIconProps = React.PropsWithoutRef<
  React.SVGProps<SVGSVGElement>
> & {
  title?: string;
  titleId?: string;
} & React.RefAttributes<SVGSVGElement>;

export const ConsolePreviewIcon = forwardRef<
  SVGSVGElement,
  ConsolePreviewIconProps
>(({ title, titleId, ...props }, svgRef) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 789 256"
      ref={svgRef}
      aria-labelledby={titleId}
      {...props}
    >
      {title && <title id={titleId}>{title}</title>}
      <g opacity=".5">
        <path
          d="M537.5 1.5h250v80h-250z"
          style={{
            fill: "none",
            stroke: "#344141 ",
            strokeWidth: 3,
            strokeOpacity: 0.7,
          }}
        />
        <path
          d="M537.5 1.5h250v80h-250z"
          style={{
            fill: "none",
            stroke: "#000000",
            strokeWidth: 3,
            strokeOpacity: 0.2,
          }}
        />
        <path
          d="M457.5 1.5h80v80h-80z"
          style={{
            fill: "none",
            stroke: "#344141",
            strokeWidth: 3,
            strokeOpacity: 0.7,
          }}
        />
        <path
          d="M457.5 1.5h80v80h-80z"
          style={{
            fill: "none",
            stroke: "#000000",
            strokeWidth: 3,
            strokeOpacity: 0.2,
          }}
        />
        <path
          d="M81.5 1.5h250v80h-250z"
          className="st1"
          style={{
            fill: "none",
            stroke: "#344141",
            strokeWidth: 3,
            strokeOpacity: 0.7,
          }}
        />
        <path
          d="M81.5 1.5h250v80h-250z"
          style={{
            fill: "none",
            stroke: "#000000",
            strokeWidth: 3,
            strokeOpacity: 0.2,
          }}
        />
        <path
          d="M1.5 1.5h80v80h-80z"
          className="st1"
          style={{
            fill: "none",
            stroke: "#344141",
            strokeWidth: 3,
            strokeOpacity: 0.7,
          }}
        />
        <path
          d="M1.5 1.5h80v80h-80z"
          style={{
            fill: "none",
            stroke: "#000000",
            strokeWidth: 3,
            strokeOpacity: 0.2,
          }}
        />
        <path
          d="M81.5 174.5h250v80h-250z"
          className="st1"
          style={{
            fill: "none",
            stroke: "#344141",
            strokeWidth: 3,
            strokeOpacity: 0.7,
          }}
        />
        <path
          d="M81.5 174.5h250v80h-250z"
          style={{
            fill: "none",
            stroke: "#000000",
            strokeWidth: 3,
            strokeOpacity: 0.2,
          }}
        />
        <path
          d="M1.5 174.5h80v80h-80z"
          className="st1"
          style={{
            fill: "none",
            stroke: "#344141",
            strokeWidth: 3,
            strokeOpacity: 0.7,
          }}
        />
        <path
          d="M1.5 174.5h80v80h-80z"
          style={{
            fill: "none",
            stroke: "#000000",
            strokeWidth: 3,
            strokeOpacity: 0.2,
          }}
        />
        <path
          d="M410 214.5v1.5h1.5v-1.5H410zm-70.5 0 15 8.7v-17.3l-15 8.6zm70.5-162V51h-1.5v1.5h1.5zm0 160.5h-57v3h57v-3zm42-162h-42v3h42v-3zm-43.5 1.5v162h3v-162h-3z"
          style={{
            fill: "#344141",
            fillOpacity: 0.7,
          }}
        />
        <path
          d="M410 214.5v1.5h1.5v-1.5H410zm-70.5 0 15 8.7v-17.3l-15 8.6zm70.5-162V51h-1.5v1.5h1.5zm0 160.5h-57v3h57v-3zm42-162h-42v3h42v-3zm-43.5 1.5v162h3v-162h-3z"
          style={{
            fillOpacity: 0.2,
          }}
        />
        <path
          d="M410 30v1.5h1.5V30H410zm-72.5 0 15 8.7V21.3l-15 8.7zM410 12.5V11h-1.5v1.5h1.5zm0 16h-59v3h59v-3zM452 11h-42v3h42v-3zm-43.5 1.5V30h3V12.5h-3z"
          style={{
            fill: "#344141",
            fillOpacity: 0.7,
          }}
        />
        <path
          d="M410 30v1.5h1.5V30H410zm-72.5 0 15 8.7V21.3l-15 8.7zM410 12.5V11h-1.5v1.5h1.5zm0 16h-59v3h59v-3zM452 11h-42v3h42v-3zm-43.5 1.5V30h3V12.5h-3z"
          style={{
            fillOpacity: 0.2,
          }}
        />
      </g>
      <path
        d="M106.5 21.5h196v40h-196zm0 173h157v40h-157zm459-173h193v40h-193z"
        style={{
          fill: "#D9D9D9",
        }}
      />
      <path
        d="M477.5 21.5h40v40h-40zm-457 0h40v40h-40zm0 173h40v40h-40z"
        style={{
          fill: "#B9B9B9",
        }}
      />
    </svg>
  );
});
