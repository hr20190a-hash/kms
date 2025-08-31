import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'px-6 py-3 font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center disabled:opacity-50 disabled:scale-100';
  
  const variantStyles = {
    primary: 'bg-pf-green text-white hover:bg-opacity-90 focus:ring-pf-green',
    secondary: 'bg-pf-beige text-pf-brown hover:bg-opacity-80 focus:ring-pf-brown',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;