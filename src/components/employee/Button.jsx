// src/components/employee/Button.jsx
import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon,
  fullWidth = false
}) => {
  const getVariantClass = () => {
    const variants = {
      'primary': 'employee-button employee-button-primary',
      'secondary': 'employee-button employee-button-secondary',
      'outline': 'employee-button employee-button-outline',
      'danger': 'employee-button employee-button-danger',
      'success': 'employee-button employee-button-success'
    };
    return variants[variant] || variants.primary;
  };

  const getSizeClass = () => {
    const sizes = {
      'small': 'px-3 py-1 text-sm',
      'medium': 'px-4 py-2',
      'large': 'px-6 py-3 text-lg'
    };
    return sizes[size] || sizes.medium;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${getVariantClass()}
        ${getSizeClass()}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;