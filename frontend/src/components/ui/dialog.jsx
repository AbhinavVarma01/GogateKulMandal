import React from 'react';

const Dialog = ({ open, children, onOpenChange, ...props }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {/* Modal Content */}
      <div className="relative z-50" {...props}>
        {children}
      </div>
    </div>
  );
};

const DialogContent = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`relative grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg rounded-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className = '', ...props }) => {
  return (
    <div
      className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
      {...props}
    />
  );
};

DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <h2
      ref={ref}
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  );
});

DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  );
});

DialogDescription.displayName = 'DialogDescription';

const DialogFooter = ({ className = '', ...props }) => {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    />
  );
};

DialogFooter.displayName = 'DialogFooter';

const DialogTrigger = React.forwardRef(({ asChild = false, children, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children, { ref, ...props });
  }
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  );
});

DialogTrigger.displayName = 'DialogTrigger';

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger };
