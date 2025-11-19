import React from 'react';

const LoadingSpinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fff8f2]">
    {/* Outer animated ring */}
    <div className="relative flex flex-col items-center justify-center w-44 h-44">
      {/* Center circle with animated spinner border and axe.png */}
      <span className="relative z-10 flex items-center justify-center w-32 h-32 rounded-full bg-white shadow-lg border-2 border-amber-100">
        {/* Animated spinner border */}
        <span className="absolute inset-0 w-full h-full rounded-full border-4 border-amber-500 border-t-transparent border-b-transparent animate-spin-slow"></span>
        <img
          src="/axe.png"
          alt="Axe Icon"
          className="w-24 h-24 object-contain rounded-full shadow-md z-10"
          style={{ background: 'radial-gradient(circle at 60% 40%, #ffe0b2 60%, #fff8f2 100%)' }}
        />
      </span>
      {/* Loading text */}
      <span className="block mt-6 text-lg font-semibold text-amber-700 tracking-wide animate-pulse">Loading...</span>
    </div>
  </div>
);

export default LoadingSpinner;
