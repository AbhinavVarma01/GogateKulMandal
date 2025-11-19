import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Crosshair, ZoomIn, ZoomOut, RotateCcw, Eye, Navigation } from 'lucide-react';

const FamilyTreeHeader = ({
  selectedVansh,
  onScrollLeft,
  onScrollRight,
  onCenter,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom
}) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const zoomPercentage = Math.round(zoom * 100);
  const isZoomedOut = zoom < 0.8;
  const isZoomedIn = zoom > 1.5;

  const Tooltip = ({ text, children, position = 'bottom' }) => (
    <div className="relative group">
      {children}
      <div className={`absolute hidden group-hover:block ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap z-50`}>
        {text}
        <div className={`absolute ${position === 'bottom' ? 'top-0 -translate-y-1' : 'bottom-0 translate-y-1'} left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45`}></div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 border-b-2 border-gradient-to-r from-blue-200 to-indigo-200 px-8 py-5 shadow-lg">
      <div className="flex items-center justify-between gap-8">
        
        {/* Left Section - Vansh Info & Navigation Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
              {selectedVansh && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Vansh</p>
                  <p className="text-lg font-bold text-gray-800">{selectedVansh}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Section - Navigation Controls */}
        <div className="flex items-center gap-6">
          
          {/* Navigation Group */}
          <div className="flex items-center gap-1 bg-white rounded-xl shadow-md p-1 border border-gray-100">
            <Tooltip text="Scroll Left - Move tree view to the left">
              <button
                onClick={onScrollLeft}
                className="p-3 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                title="Scroll Left"
              >
                <ChevronLeft size={22} />
              </button>
            </Tooltip>
            
            <div className="w-px h-8 bg-gray-200"></div>
            
            <Tooltip text="Center Tree - Reset view to center">
              <button
                onClick={onCenter}
                className="p-3 text-gray-600 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                title="Center Tree"
              >
                <Navigation size={22} />
              </button>
            </Tooltip>
            
            <div className="w-px h-8 bg-gray-200"></div>
            
            <Tooltip text="Scroll Right - Move tree view to the right">
              <button
                onClick={onScrollRight}
                className="p-3 text-gray-600 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                title="Scroll Right"
              >
                <ChevronRight size={22} />
              </button>
            </Tooltip>
          </div>

          {/* Zoom Controls Group */}
          <div className="flex items-center gap-1 bg-white rounded-xl shadow-md p-1 border border-gray-100">
            <Tooltip text="Zoom Out - See more of the tree">
              <button
                onClick={onZoomOut}
                disabled={isZoomedOut}
                className="p-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut size={22} />
              </button>
            </Tooltip>

            {/* Zoom Percentage Display */}
            <div className="px-4 py-2 mx-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 min-w-[80px] text-center">
              <div className="flex items-center justify-center gap-1">
                <Eye size={16} className="text-blue-600" />
                <span className="font-bold text-gray-800 text-sm">{zoomPercentage}%</span>
              </div>
            </div>

            <Tooltip text="Reset Zoom - Return to default zoom level">
              <button
                onClick={onResetZoom}
                className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm"
                title="Reset Zoom"
              >
                <RotateCcw size={16} className="inline mr-1" />
                Reset
              </button>
            </Tooltip>

            <Tooltip text="Zoom In - See details of the tree">
              <button
                onClick={onZoomIn}
                disabled={isZoomedIn}
                className="p-3 text-gray-600 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <ZoomIn size={22} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Right Section - Zoom Status Indicator */}
        <div className="flex-1 flex justify-end">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Zoom Level</p>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-200"
                style={{ width: `${Math.min((zoom / 3) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Border */}
      <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-30"></div>
    </div>
  );
};

export default FamilyTreeHeader;