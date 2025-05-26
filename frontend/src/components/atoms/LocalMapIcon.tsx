import React from "react";

// Outline of Calderdale (simplified)
export const LocalMapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    className={"w-8 h-8 stroke-black " + (props.className || "")}
  >
    <path
      d="M12 52 L18 36 L28 28 L38 22 L50 30 L54 44 L44 54 L28 58 Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);
