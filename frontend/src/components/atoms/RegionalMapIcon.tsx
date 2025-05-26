import React from "react";

// Outline of City of London (simplified)
export const RegionalMapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    className={"w-8 h-8 stroke-black " + (props.className || "")}
  >
    <path
      d="M10 54 L14 34 L24 24 L44 18 L54 28 L50 44 L34 54 Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);
