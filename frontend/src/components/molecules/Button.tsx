import React from 'react';
import clsx from 'clsx';
import Loader from '../atoms/Loader';
import { MailCheck, MailX } from 'lucide-react';
import './Button.scss';

type ButtonProps = {
  text?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
  size?: 'none' | 'small' | 'medium' | 'large' | 'login';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  checked?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  type,
  text,
  onClick,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  className,
  icon,
  checked = undefined,
}) => {
  const baseStyles =
    'rounded-lg font-semibold focus:outline-none flex items-center justify-center border-none';
  const variantStyles = {
    primary:
      'bg-neutral-800 text-white hover:bg-gray-700  focus:ring-neutral-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    link: 'text-blue-500 hover:underline focus:ring-transparent',
  };

  const sizeStyles = {
    none: '',
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-5 py-3 text-lg',
    login: 'w-full px-2 py-2 text-base',
  };

  const checkedClass =
    checked === undefined
      ? ''
      : checked
        ? 'button--checked'
        : 'button--unchecked';
  const buttonText = text ?? (checked ? 'Checked' : 'Unchecked');

  const classes = clsx(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    checkedClass,
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  console.log('FOO', checked);

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled || isLoading}
      aria-label={buttonText}
    >
      {isLoading ? (
        <Loader size={size} variant={variant} />
      ) : (
        <>
          {checked !== undefined && (
            <span className="mr-2 flex items-center">
              {checked ? <MailCheck size={18} /> : <MailX size={18} />}
            </span>
          )}
          {icon && <span className="mr-2 flex items-center">{icon}</span>}
          {buttonText}
        </>
      )}
    </button>
  );
};

export default Button;
