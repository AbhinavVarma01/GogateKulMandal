import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AccessibilityContext = createContext(null);

const DEFAULT_FONT_SIZE = 100; // percentage
const MIN_FONT_SIZE = 80;
const MAX_FONT_SIZE = 150;

const DEFAULT_LINE_HEIGHT = 1.5; // unitless multiplier
const MIN_LINE_HEIGHT = 1.2;
const MAX_LINE_HEIGHT = 2.5;

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [lineHeight, setLineHeight] = useState(DEFAULT_LINE_HEIGHT);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const speechRecognitionRef = useRef(null);

  // Apply styles globally when settings change
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  useEffect(() => {
    document.body.style.lineHeight = String(lineHeight);
  }, [lineHeight]);

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(MAX_FONT_SIZE, prev + 5));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(MIN_FONT_SIZE, prev - 5));
  }, []);

  const increaseLineHeight = useCallback(() => {
    setLineHeight((prev) => Math.min(MAX_LINE_HEIGHT, +(prev + 0.1).toFixed(1)));
  }, []);

  const decreaseLineHeight = useCallback(() => {
    setLineHeight((prev) => Math.max(MIN_LINE_HEIGHT, +(prev - 0.1).toFixed(1)));
  }, []);

  const resetToDefault = useCallback(() => {
    setFontSize(DEFAULT_FONT_SIZE);
    setLineHeight(DEFAULT_LINE_HEIGHT);
    setIsHighContrast(false);
  }, []);

  const handleVoiceCommand = useCallback((rawCommand) => {
    if (!rawCommand) return;
    const command = String(rawCommand).toLowerCase().trim();
    if (command.includes('increase font') || command.includes('bigger font') || command.includes('font up')) {
      increaseFontSize();
      return;
    }
    if (command.includes('decrease font') || command.includes('smaller font') || command.includes('font down')) {
      decreaseFontSize();
      return;
    }
    if (command.includes('increase spacing') || command.includes('more spacing') || command.includes('spacing up')) {
      increaseLineHeight();
      return;
    }
    if (command.includes('decrease spacing') || command.includes('less spacing') || command.includes('spacing down')) {
      decreaseLineHeight();
      return;
    }
    if (command.includes('reset') || command.includes('default') || command.includes('clear')) {
      resetToDefault();
      return;
    }
    if (command.includes('go home') || command.includes('home page') || command === 'home') {
      window.location.assign('/');
      return;
    }
    if (command.includes('contrast')) {
      setIsHighContrast((v) => !v);
      return;
    }
  }, [increaseFontSize, decreaseFontSize, increaseLineHeight, decreaseLineHeight, resetToDefault]);

  const stopListening = useCallback(() => {
    try {
      const rec = speechRecognitionRef.current;
      if (rec && typeof rec.stop === 'function') {
        rec.stop();
      }
    } catch (_) {
      // ignore
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // No support
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        if (!last) return;
        const transcript = last[0]?.transcript;
        handleVoiceCommand(transcript);
      };
      recognition.onend = () => {
        setIsListening(false);
        if (isVoiceEnabled) {
          // attempt to restart if still enabled
          startListening();
        }
      };
      recognition.onerror = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (_) {
      setIsListening(false);
    }
  }, [handleVoiceCommand, isVoiceEnabled]);

  const toggleVoiceCommands = useCallback(() => {
    setIsVoiceEnabled((prev) => {
      const next = !prev;
      if (next) {
        startListening();
      } else {
        stopListening();
      }
      return next;
    });
  }, [startListening, stopListening]);

  // Expose for debugging as referenced by components
  useEffect(() => {
    window.accessibilityContext = {
      handleVoiceCommand,
      increaseFontSize,
      decreaseFontSize,
      increaseLineHeight,
      decreaseLineHeight,
      resetToDefault,
    };
    return () => {
      if (window.accessibilityContext) {
        delete window.accessibilityContext;
      }
    };
  }, [handleVoiceCommand, increaseFontSize, decreaseFontSize, increaseLineHeight, decreaseLineHeight, resetToDefault]);

  const value = useMemo(() => ({
    fontSize,
    lineHeight,
    isHighContrast,
    isVoiceEnabled,
    isListening,
    increaseFontSize,
    decreaseFontSize,
    increaseLineHeight,
    decreaseLineHeight,
    toggleVoiceCommands,
    resetToDefault,
  }), [fontSize, lineHeight, isHighContrast, isVoiceEnabled, isListening, increaseFontSize, decreaseFontSize, increaseLineHeight, decreaseLineHeight, toggleVoiceCommands, resetToDefault]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return ctx;
}


