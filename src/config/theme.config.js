const ThemeConfig = {
  colors: {
    primary: '#0084e6',
    secondary: '#64b5f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
  },
  
  typography: {
    fontFamily: "'Inter', sans-serif",
    fontSize: { base: '1rem', lg: '1.125rem', xl: '1.25rem' }
  },
  
  spacing: { 0: '0', 1: '0.25rem', 2: '0.5rem', 4: '1rem', 8: '2rem' },
  
  borderRadius: { base: '0.25rem', lg: '0.5rem', full: '9999px' },
  
  boxShadow: {
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }
};

export default ThemeConfig;