import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Accessibility, 
  Plus, 
  Minus, 
  RotateCcw, 
  Mic, 
  MicOff,

  AlignJustify,
  Type,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';

const AccessibilityToolbar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toolbarRef = useRef(null);
  const { t } = useLanguage();
  
  const {
    fontSize,
    lineHeight,
    isVoiceEnabled,
    isListening,
    increaseFontSize,
    decreaseFontSize,
    increaseLineHeight,
    decreaseLineHeight,
    toggleVoiceCommands,
    resetToDefault
  } = useAccessibility();

  // Close toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // toolbarItems UI is directly rendered below; removed intermediate array to avoid unused warnings

  return (
    <>
      {/* Floating Accessibility Button */}
      <div 
        className={`fixed right-4 left-4 sm:left-auto transition-all duration-300 z-[100] ${
          isExpanded ? 'bottom-6' : 'bottom-6'
        }`}
        ref={toolbarRef}
      >
        {/* Main Toolbar Panel */}
        {isExpanded && (
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 mb-4 w-full sm:w-80 max-h-[80vh] overflow-y-auto animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Accessibility size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800">{t('accessibility.toolbar')}</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close accessibility toolbar"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Font Size Controls */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <Type size={16} className="mr-2" />
                  {t('accessibility.fontSize')}
                </span>
                <span className="text-xs text-gray-500">{fontSize}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize <= 80}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                    fontSize <= 80 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                  aria-label="Decrease font size"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((fontSize - 80) / 70) * 100}%` }}
                  />
                </div>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize >= 150}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                    fontSize >= 150 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                  aria-label="Increase font size"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Line Spacing Controls */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <AlignJustify size={16} className="mr-2" />
                  {t('accessibility.lineSpacing')}
                </span>
                <span className="text-xs text-gray-500">{lineHeight.toFixed(1)}x</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={decreaseLineHeight}
                  disabled={lineHeight <= 1.2}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                    lineHeight <= 1.2 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                  aria-label="Decrease line spacing"
                >
                  <ChevronDown size={14} />
                </button>
                <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((lineHeight - 1.2) / 1.3) * 100}%` }}
                  />
                </div>
                <button
                  onClick={increaseLineHeight}
                  disabled={lineHeight >= 2.5}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                    lineHeight >= 2.5 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                  aria-label="Increase line spacing"
                >
                  <ChevronUp size={14} />
                </button>
              </div>
            </div>

            {/* Toggle Controls */}
            <div className="space-y-2 mb-4">
              <button
                onClick={toggleVoiceCommands}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                  isVoiceEnabled 
                    ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={`${isVoiceEnabled ? 'Disable' : 'Enable'} voice commands`}
              >
                <div className="flex items-center">
                  {isVoiceEnabled ? (
                    isListening ? (
                      <Mic size={16} className={`mr-3 ${isListening ? 'animate-pulse text-red-500' : ''}`} />
                    ) : (
                      <MicOff size={16} className="mr-3" />
                    )
                  ) : (
                    <Mic size={16} className="mr-3" />
                  )}
                  <span className="text-sm font-medium">
                    {t('accessibility.voiceCommands')} {isListening && `(${t('accessibility.listening')})`}
                  </span>
                </div>
                <div className={`w-4 h-4 rounded-full ${isVoiceEnabled ? 'bg-orange-600' : 'bg-gray-300'}`} />
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetToDefault}
              className="w-full flex items-center justify-center p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              aria-label="Reset all accessibility settings to default"
            >
              <RotateCcw size={16} className="mr-2" />
              <span className="text-sm font-medium">{t('accessibility.resetToDefault')}</span>
            </button>

            {/* Voice Commands Help */}
            {isVoiceEnabled && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  🎤 {t('accessibility.voiceCommandsHelp')}
                  {isListening && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded animate-pulse">LISTENING</span>}
                </h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div><strong>Font Size:</strong></div>
                  <div>• "Increase font" / "Bigger font" / "Font up"</div>
                  <div>• "Decrease font" / "Smaller font" / "Font down"</div>
                  
                  <div className="mt-2"><strong>Line Spacing:</strong></div>
                  <div>• "Increase spacing" / "More spacing" / "Spacing up"</div>
                  <div>• "Decrease spacing" / "Less spacing" / "Spacing down"</div>
                  
                  <div className="mt-2"><strong>Other Commands:</strong></div>
                  <div>• "Reset" / "Default" / "Clear"</div>
                  <div>• "Go home" / "Home page"</div>
                </div>
                
                <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                  <strong>💡 Tips:</strong> Speak clearly and wait for the command to process. You'll see visual feedback when commands are recognized.
                </div>
                
                {/* Debug buttons for testing */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      console.log('🧪 Testing voice command: increase font');
                      if (window.accessibilityContext) {
                        window.accessibilityContext.handleVoiceCommand('increase font');
                      }
                    }}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                  >
                    Test "increase font"
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔍 Checking voice support...');
                      const hasSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
                      alert(`Voice recognition supported: ${hasSupport ? 'Yes' : 'No'}`);
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                  >
                    Check Support
                  </button>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Help */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Keyboard Shortcuts:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Alt + =</kbd> Increase font</li>
                <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Alt + -</kbd> Decrease font</li>
                <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Alt + ↑</kbd> More spacing</li>
                <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Alt + ↓</kbd> Less spacing</li>
                <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Alt + R</kbd> Reset</li>
              </ul>
            </div>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            isExpanded 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
          aria-label={`${isExpanded ? 'Close' : 'Open'} accessibility toolbar`}
        >
          <Accessibility size={24} />
        </button>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default AccessibilityToolbar;
