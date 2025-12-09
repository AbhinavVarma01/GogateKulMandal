import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18n';
import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));

function AutoLogoutWrapper({ children }) {
  // DISABLED: Auto-logout on page visibility change was causing logout on refresh
  // If you need to re-enable auto-logout, uncomment the useEffect below
  
  /*
  useEffect(() => {
    const doLogout = () => {
      try {
        // Try to notify backend logout endpoint if it exists using sendBeacon or fetch keepalive
        const token = localStorage.getItem('authToken');
        const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';
        const logoutUrl = `${base}/api/auth/logout`;

        if (token) {
          // Try sendBeacon with Authorization in body (some servers may not accept header via beacon)
          const body = JSON.stringify({});
          if (navigator && navigator.sendBeacon) {
            // sendBeacon cannot set headers; include token in body as fallback
            const blob = new Blob([body], { type: 'application/json' });
            try {
              navigator.sendBeacon(logoutUrl, blob);
            } catch (err) {
              // ignore
            }
          } else if (typeof fetch === 'function') {
            try {
              // use synchronous XHR is deprecated; use fetch with keepalive
              fetch(logoutUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body,
                keepalive: true,
              });
            } catch (err) {
              // ignore
            }
          }
        }
      } catch (err) {
        // swallow errors
      } finally {
        // Always clear client-side auth state
        try {
          localStorage.removeItem('authToken');
        } catch (_) {}
      }
    };

    // Track if user is actually navigating away vs just refreshing
    let isNavigating = false;

    const handleBeforeUnload = (e) => {
      // Set flag that indicates navigation/close is happening
      isNavigating = true;
    };

    const handleVisibilityChange = () => {
      // Only logout if page becomes hidden AND we're not navigating
      // This catches tab close but not tab switch
      if (document.visibilityState === 'hidden' && !isNavigating) {
        // Small delay to differentiate between tab close vs tab switch
        setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            doLogout();
          }
        }, 100);
      }
    };

    const handlePageHide = () => {
      // pagehide fires on actual close, but not on tab switch
      // Only logout if we're not just switching tabs
      if (document.visibilityState === 'hidden') {
        doLogout();
      }
    };

    // Register handlers
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  */

  return children;
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AutoLogoutWrapper>
        <App />
      </AutoLogoutWrapper>
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
