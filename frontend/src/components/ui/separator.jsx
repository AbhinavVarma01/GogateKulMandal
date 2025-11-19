import React from 'react';

const Separator = ({ className = '', orientation = 'horizontal', ...props }) => {
  const baseClasses = orientation === 'horizontal' 
    ? 'h-px w-full bg-gray-200' 
    : 'w-px h-full bg-gray-200';
  
  return (
    <div 
      className={`${baseClasses} ${className}`} 
      {...props} 
    />
  );
};

export { Separator };
