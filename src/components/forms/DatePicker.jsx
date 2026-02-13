import React from 'react';

const DatePicker = ({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  className = '',
  ...props
}) => {
  const inputId = name || `datepicker-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        min={minDate}
        max={maxDate}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        {...props}
      />
      
      {error && <div className="invalid-feedback">{error}</div>}
      {helperText && !error && <div className="form-text">{helperText}</div>}
    </div>
  );
};

export default DatePicker;