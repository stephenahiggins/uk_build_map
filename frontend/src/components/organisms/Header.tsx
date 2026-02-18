import React, { ReactNode } from 'react';
import Callout from '../molecules/Callout';

interface HeaderProps {
  title: string;
  children?: ReactNode;
  banner?: ReactNode;
  callout?: ReactNode;
  calloutComponent?: ReactNode;
  calloutTextSize?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  children,
  banner,
  callout,
  calloutComponent,
  calloutTextSize = 'text-sm',
}) => (
  <div className="w-full bg-white shadow p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between">
    <div className="flex flex-col lg:flex-row lg:items-start gap-4 flex-1">
      <h1 className="text-5xl font-bold mb-2 lg:mb-0">{title}</h1>
      {callout && (
        <div
          className={`${calloutTextSize} text-gray-600 flex-1 leading-relaxed pl-0 lg:pl-6 pr-2 ${calloutComponent ? 'mb-4 lg:mb-0' : ''}`}
        >
          {callout}
        </div>
      )}
      {banner && (
        <div className="hidden lg:block flex-1 max-w-lg">{banner}</div>
      )}
    </div>
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
      {calloutComponent}
      {children}
    </div>
    {banner && <div className="lg:hidden mt-4">{banner}</div>}
  </div>
);

export default Header;
