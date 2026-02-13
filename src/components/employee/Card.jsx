// src/components/employee/Card.jsx
import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  padding = 'default'
}) => {
  const getPaddingClass = () => {
    const paddings = {
      'default': '',
      'small': 'p-4',
      'large': 'p-8'
    };
    return paddings[padding] || '';
  };

  return (
    <div className={`employee-card ${getPaddingClass()} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`employee-card-header ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`employee-card-body ${className}`}>
    {children}
  </div>
);

export default Card;