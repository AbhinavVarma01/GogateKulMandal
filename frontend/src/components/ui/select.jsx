import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({ className = '', children, value, onValueChange, ...props }, ref) => {
  return (
    <div className="relative" ref={ref}>
      {children}
    </div>
  );
});

Select.displayName = 'Select';

const SelectContent = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`fixed z-[9999] min-w-[8rem] max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white text-gray-900 shadow-xl ${className}`}
      style={{
        top: 'auto',
        bottom: 'auto',
        left: 'auto',
        right: 'auto'
      }}
      {...props}
    >
      {children}
    </div>
  );
});

SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef(({ className = '', children, value, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

SelectItem.displayName = 'SelectItem';

const SelectTrigger = React.forwardRef(({ className = '', children, onClick, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef(({ className = '', placeholder, value, children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={`${value ? 'text-gray-900' : 'text-gray-500'} ${className}`}
      {...props}
    >
      {value || placeholder}
    </span>
  );
});

SelectValue.displayName = 'SelectValue';

// Custom Select component with proper dropdown functionality
export const CustomSelect = ({ value, onValueChange, children, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const selectRef = useRef(null);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when dropdown is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleItemClick = (itemValue) => {
    setSelectedValue(itemValue);
    onValueChange(itemValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <SelectTrigger 
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <SelectValue placeholder={placeholder} value={selectedValue}>
          {children.find(child => child.props.value === selectedValue)?.props.children}
        </SelectValue>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </SelectTrigger>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {children.map((child, index) => (
            <div
              key={index}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-150 ${
                selectedValue === child.props.value ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-900'
              }`}
              onClick={() => handleItemClick(child.props.value)}
              role="option"
              aria-selected={selectedValue === child.props.value}
            >
              {child.props.children}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
