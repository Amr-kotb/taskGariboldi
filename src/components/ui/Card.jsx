import React from 'react';

const Card = ({ 
  children, 
  title,
  subtitle,
  header,
  footer,
  className = '',
  hover = false,
  padding = true,
  ...props
}) => {
  return (
    <div 
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
      {...props}
    >
      {header && (
        <div className="card-header">
          {typeof header === 'string' ? <h3>{header}</h3> : header}
        </div>
      )}
      
      {(title || subtitle) && !header && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className={`card-body ${padding ? 'p-3' : 'p-0'}`}>
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;