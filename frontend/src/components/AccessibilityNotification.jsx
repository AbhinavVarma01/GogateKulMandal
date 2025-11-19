import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Check, Volume2, Eye } from 'lucide-react';

const AccessibilityNotification = () => {
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const { fontSize, lineHeight, isHighContrast, isVoiceEnabled } = useAccessibility();
  const { t } = useLanguage();
  
  // Use refs to track previous values instead of localStorage
  const prevFontSize = useRef(fontSize);
  const prevLineHeight = useRef(lineHeight);
  const prevHighContrast = useRef(isHighContrast);
  const prevVoiceEnabled = useRef(isVoiceEnabled);

  const showNotification = (message, icon, duration = 2000) => {
    setNotification({ message, icon });
    setIsVisible(true);
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setNotification(null), 300);
    }, duration);
  };

  // Monitor accessibility changes using refs
  useEffect(() => {
    if (prevFontSize.current !== fontSize) {
      // Only show notification if it's not the initial load
      if (prevFontSize.current !== 100 || fontSize !== 100) {
        showNotification(
          `${t('accessibility.fontSize')}: ${fontSize}%`,
          <span className="text-2xl">🔤</span>
        );
      }
      prevFontSize.current = fontSize;
    }
  }, [fontSize, t]);

  useEffect(() => {
    if (prevLineHeight.current !== lineHeight) {
      // Only show notification if it's not the initial load
      if (prevLineHeight.current !== 1.5 || lineHeight !== 1.5) {
        showNotification(
          `${t('accessibility.lineSpacing')}: ${lineHeight.toFixed(1)}x`,
          <span className="text-2xl">📏</span>
        );
      }
      prevLineHeight.current = lineHeight;
    }
  }, [lineHeight, t]);

  useEffect(() => {
    if (prevHighContrast.current !== isHighContrast) {
      // Only show notification if it's not the initial load
      if (prevHighContrast.current !== false || isHighContrast !== false) {
        showNotification(
          isHighContrast 
            ? `${t('accessibility.highContrast')}: On` 
            : `${t('accessibility.highContrast')}: Off`,
          <Eye size={20} />
        );
      }
      prevHighContrast.current = isHighContrast;
    }
  }, [isHighContrast, t]);

  useEffect(() => {
    if (prevVoiceEnabled.current !== isVoiceEnabled) {
      // Only show notification if it's not the initial load
      if (prevVoiceEnabled.current !== false || isVoiceEnabled !== false) {
        showNotification(
          isVoiceEnabled 
            ? `${t('accessibility.voiceCommands')}: On` 
            : `${t('accessibility.voiceCommands')}: Off`,
          <Volume2 size={20} />
        );
      }
      prevVoiceEnabled.current = isVoiceEnabled;
    }
  }, [isVoiceEnabled, t]);

  if (!notification) return null;

  return (
    <div 
      className={`fixed top-24 right-6 z-[110] transform transition-all duration-300 ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center space-x-3 min-w-[200px]">
        <div className="flex-shrink-0">
          {notification.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
        <div className="flex-shrink-0">
          <Check size={16} />
        </div>
      </div>
    </div>
  );
};

export default AccessibilityNotification;