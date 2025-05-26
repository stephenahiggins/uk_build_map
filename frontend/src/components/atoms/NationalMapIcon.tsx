import React from "react";

// Outline of Great Britain (simplified)
export const NationalMapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 64 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    className={"w-8 h-10 stroke-black " + (props.className || "")}
  >
    <path
      d="M14 76 L24 60 L20 52 L30 38 L24 30 L32 18 L28 6 L38 2 L44 10 L50 18 L54 28 L52 38 L60 48 L54 60 L48 74 L36 78 Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);
