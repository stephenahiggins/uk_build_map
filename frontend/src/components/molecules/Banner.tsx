import React from 'react';
import clsx from 'clsx';

interface BannerProps {
  className?: string;
  bgClassName?: string; // Tailwind background color classes
  textClassName?: string; // Tailwind text color classes
  borderClassName?: string; // Optional border color classes
  children?: React.ReactNode;
  icon?: React.ReactNode;
  githubUrl?: string;
}

/*
  Banner molecule
  - Lightweight, responsive information banner.
  - Accepts tailwind utility class overrides for background, text, and border.
  - Defaults chosen to be attention-grabbing but neutral.
*/
const Banner: React.FC<BannerProps> = ({
  className,
  bgClassName = 'bg-amber-50',
  textClassName = 'text-amber-900',
  borderClassName = 'border-amber-300',
  children,
  icon,
  githubUrl,
}) => {
  return (
    <div
      className={clsx(
        'w-full flex flex-col sm:flex-row gap-2 sm:items-center rounded-md border px-4 py-3 text-sm shadow-sm',
        bgClassName,
        textClassName,
        borderClassName,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <span className="flex items-center" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="flex-1 leading-relaxed">
        {children}
        {githubUrl && (
          <span className="block sm:inline sm:ml-1">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-blue-600 transition-colors"
            >
              Contribute on GitHub
            </a>
          </span>
        )}
      </div>
    </div>
  );
};

export default Banner;
