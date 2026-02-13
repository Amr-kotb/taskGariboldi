import React from 'react';

const Badge = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  pill = false,
  className = ''
}) => {
  const variants = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
    light: 'badge-light',
    dark: 'badge-dark'
  };

  const sizes = {
    small: 'badge-sm',
    medium: '',
    large: 'badge-lg'
  };

  const classes = [
    'badge',
    variants[variant] || variants.primary,
    sizes[size],
    pill ? 'badge-pill' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export default Badge;