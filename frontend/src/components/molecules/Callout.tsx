import React from 'react';
import { cn } from '../../lib/utils';
import * as Icons from 'react-icons/fi'; // Feather icons from react-icons

export interface CalloutProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'info'
    | 'warning'
    | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Icons | React.ReactNode;
  className?: string;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | number;
  iconSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | number;
}

const calloutVariants = {
  default:
    'border-transparent bg-primary text-white shadow hover:bg-primary-dark',
  secondary: 'border-transparent bg-purple-600 text-white hover:bg-purple-700',
  destructive:
    'border-transparent bg-red-500 text-white shadow hover:bg-red-600',
  outline:
    'text-primary border-primary bg-transparent hover:bg-primary hover:text-white',
  info: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200',
  warning:
    'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  success: 'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
};

const calloutSizes = {
  sm: 'px-2 py-1',
  md: 'px-2.5 py-0.5',
  lg: 'px-3 py-1',
};

const fontSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  base: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/*
  Callout molecule
  - A versatile badge-like component for highlighting information
  - Supports Feather icons via react-icons/fi
  - Multiple variants and sizes for different use cases
  - Font size can be set using predefined sizes ('xs', 'sm', 'base', 'lg', 'xl') or custom pixel values (number)
  - Icon size can be set using predefined sizes ('xs', 'sm', 'base', 'lg', 'xl') or custom pixel values (number)
  - Can be used in banners, pages, or any other component
*/
const Callout: React.FC<CalloutProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
  fontSize = 'sm',
  iconSize,
}) => {
  const getFontSizeStyle = () => {
    if (typeof fontSize === 'number') {
      return { fontSize: `${fontSize}px` };
    }
    return {};
  };

  const getFontSizeClass = () => {
    if (typeof fontSize === 'string') {
      return fontSizes[fontSize];
    }
    return '';
  };

  const getIconSizeStyle = () => {
    if (typeof iconSize === 'number') {
      return { width: `${iconSize}px`, height: `${iconSize}px` };
    }
    return {};
  };

  const getIconSizeClass = () => {
    if (typeof iconSize === 'string') {
      return iconSizes[iconSize];
    }
    // Fallback to fontSize if iconSize is not provided
    if (typeof fontSize === 'string') {
      return iconSizes[fontSize];
    }
    return '';
  };

  const renderIcon = () => {
    if (!icon) return null;

    const iconSizeClass = getIconSizeClass();
    const iconSizeStyle = getIconSizeStyle();

    if (typeof icon === 'string') {
      const IconComponent = Icons[icon as keyof typeof Icons];
      return IconComponent ? (
        <IconComponent
          className={`${iconSizeClass} mr-2`}
          style={iconSizeStyle}
        />
      ) : null;
    }

    return (
      <span className="mr-2" style={iconSizeStyle}>
        {icon}
      </span>
    );
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        calloutVariants[variant],
        calloutSizes[size],
        getFontSizeClass(),
        className
      )}
      style={getFontSizeStyle()}
    >
      {renderIcon()}
      {children}
    </div>
  );
};

export default Callout;
