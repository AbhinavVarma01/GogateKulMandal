import { useEffect } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useNavigate } from 'react-router-dom';

// Simple feedback function
const showKeyboardShortcutFeedback = (message) => {
  // Create temporary notification
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #059669;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);
  
  // Remove after 2 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 2000);
};

const KeyboardShortcuts = () => {
  const { 
    increaseFontSize, 
    decreaseFontSize, 
    increaseLineHeight, 
    decreaseLineHeight,
    resetToDefault 
  } = useAccessibility();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if Alt key is pressed for accessibility shortcuts
      if (event.altKey) {
        switch (event.code) {
          case 'Equal': // Alt + = (increase font)
          case 'NumpadAdd': // Alt + numpad +
            event.preventDefault();
            increaseFontSize();
            showKeyboardShortcutFeedback('Font size increased');
            break;
          case 'Minus': // Alt + - (decrease font)
          case 'NumpadSubtract': // Alt + numpad -
            event.preventDefault();
            decreaseFontSize();
            showKeyboardShortcutFeedback('Font size decreased');
            break;
          case 'ArrowUp': // Alt + ↑ (increase line spacing)
            event.preventDefault();
            increaseLineHeight();
            showKeyboardShortcutFeedback('Line spacing increased');
            break;
          case 'ArrowDown': // Alt + ↓ (decrease line spacing)
            event.preventDefault();
            decreaseLineHeight();
            showKeyboardShortcutFeedback('Line spacing decreased');
            break;

          case 'KeyR': // Alt + R (reset)
            event.preventDefault();
            resetToDefault();
            showKeyboardShortcutFeedback('Settings reset to default');
            break;
          case 'KeyH': // Alt + H (home)
            event.preventDefault();
            navigate('/');
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [increaseFontSize, decreaseFontSize, increaseLineHeight, decreaseLineHeight, resetToDefault, navigate]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;