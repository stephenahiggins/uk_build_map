import React, { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  children?: ReactNode;
  banner?: ReactNode;
  callout?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  children,
  banner,
  callout,
}) => (
  <div className="w-full bg-white shadow p-6 flex flex-col md:flex-row md:items-start md:justify-between">
    <div className="flex flex-col md:flex-row md:items-start gap-4 flex-1">
      <h1 className="text-2xl font-bold mb-4 md:mb-0">{title}</h1>
      {callout && (
        <div className="text-sm text-gray-600 flex-1 leading-relaxed pl-6">
          {callout}
        </div>
      )}
      {banner && (
        <div className="hidden md:block flex-1 max-w-lg">{banner}</div>
      )}
    </div>
    {children}
    {banner && <div className="md:hidden mt-4">{banner}</div>}
  </div>
);

export default Header;
