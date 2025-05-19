import React, { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, children }) => (
  <div className="header w-full bg-white shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between">
    <h1 className="text-2xl font-bold mb-4 md:mb-0">{title}</h1>
    {children}
  </div>
);

export default Header;
