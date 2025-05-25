import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, inputClassName, iconClassName, ...props }, ref) => {
    return (
      <div className={`relative w-full ${className || ''}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search
            className={`h-5 w-5 text-gray-400 ${iconClassName || ''}`}
            aria-hidden="true"
          />
        </div>
        <input
          type="text"
          className={`
            block w-full rounded-md border-0 py-3 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300
            placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6
            transition-colors duration-200 ${inputClassName || ''}
          `}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export { SearchBar };
