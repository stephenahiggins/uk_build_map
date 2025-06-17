import React, { forwardRef } from 'react';
import clsx from 'clsx';

type InputProps = {
  type?: 'text' | 'password' | 'email' | 'number';
  size?: 'small' | 'medium' | 'large' | 'login';
  placeholder?: string;
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  reactHookFormRegister?: any;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      size = 'medium',
      placeholder,
      label,
      value,
      onChange,
      className,
      disabled = false,
      reactHookFormRegister,
    },
    ref
  ) => {
    const sizeStyles = {
      small: 'text-sm px-2 py-1',
      medium: 'text-base px-3 py-2',
      large: 'text-lg px-4 py-3',
      login: 'w-full px-2 py-2 text-base',
    };

    return (
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        aria-label={label}
        ref={ref}
        onChange={onChange}
        className={clsx(
          'border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500',
          sizeStyles[size],
          disabled && 'bg-gray-100 cursor-not-allowed',
          className
        )}
        disabled={disabled}
        {...reactHookFormRegister}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
