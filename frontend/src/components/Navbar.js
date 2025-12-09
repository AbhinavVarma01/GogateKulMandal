import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Navbar = () => {

  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [aboutDropdown, setAboutDropdown] = useState(false);
  const [otherDropdown, setOtherDropdown] = useState(false);
  const navbarRef = useRef(null);

  // Track token reactively
  const [token, setToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    !!(token && token !== 'undefined' && token !== 'null' && token.trim() !== '')
  );

  // Get user role
  const getUserRole = () => {
    const userStr = typeof window !== 'undefined' ? 
      (localStorage.getItem('user') || localStorage.getItem('currentUser')) : null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('User data from localStorage:', user);
        return user.role || 'user';
      } catch (e) {
        console.log('Error parsing user data:', e);
        return 'user';
      }
    }
    console.log('No user data found in localStorage');
    return 'user';
  };

  // Get user vansh number
  const getUserVansh = () => {
    const userStr = typeof window !== 'undefined' ? 
      (localStorage.getItem('user') || localStorage.getItem('currentUser')) : null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.managedVansh || user.vanshNo || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // Listen for token changes (login/logout in other tabs/windows)
  useEffect(() => {
    const handleStorage = () => {
      const t = localStorage.getItem('authToken');
      setToken(t);
      setIsLoggedIn(!!(t && t !== 'undefined' && t !== 'null' && t.trim() !== ''));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Update isLoggedIn when token changes in this tab
  useEffect(() => {
    setIsLoggedIn(!!(token && token !== 'undefined' && token !== 'null' && token.trim() !== ''));
  }, [token]);

  // Update token on route change (for immediate effect after login/logout)
  useEffect(() => {
  const t = localStorage.getItem('authToken');
  setToken(t);
  }, [location]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
    setAboutDropdown(false);
    setOtherDropdown(false);
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setAboutDropdown(false);
        setOtherDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  // Helper for protected navigation
  // When logged out, allow navigating to Home; gate other internal routes
  const handleProtectedNav = (e, to) => {
    if (!isLoggedIn) {
      if (to === '/') {
        // Allow default navigation to Home
        handleScrollToTop();
        return;
      }
      e.preventDefault();
      navigate('/login');
      return;
    }
    if (to && to.startsWith('/')) {
      handleScrollToTop();
    }
  };

  const handleAboutMouseEnter = () => {
    setAboutDropdown(true);
  };

  const handleAboutMouseLeave = () => {
    setAboutDropdown(false);
  };

  const handleOtherMouseEnter = () => {
    setOtherDropdown(true);
  };

  const handleOtherMouseLeave = () => {
    setOtherDropdown(false);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // If using React Router, add navigation logic here
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      setToken(null);
      setIsLoggedIn(false);
      navigate('/login', { replace: true });
      setTimeout(() => {
        if (window.history && window.history.pushState) {
          const state = { noBackExitsApp: true };
          window.history.pushState(state, '', window.location.href);
          window.onpopstate = function () {
            navigate('/login', { replace: true });
          };
        }
      }, 0);
    } catch (e) {
      navigate('/login', { replace: true });
    }
  };

  const requestLogout = () => setShowLogoutConfirm(true);
  const cancelLogout = () => setShowLogoutConfirm(false);
  const confirmLogout = () => { setShowLogoutConfirm(false); handleLogout(); };

  return (
    <div className="sticky top-0 z-50 w-full px-4 py-2">
      <nav 
        ref={navbarRef}
        className="max-w-7xl mx-auto rounded-full transition-all duration-300 bg-amber-50/90 backdrop-blur-sm shadow-sm border border-orange-100"
      >
        <div className="px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-3 group focus:outline-none rounded-lg p-1 transition-all duration-200"
                aria-label="Go to homepage"
                onClick={handleScrollToTop}
              >
                <img 
                  src="/logo1.png" 
                  alt="गोगटे कुलमंडळ Logo" 
                  className="w-14 h-14 lg:w-20 lg:h-20 group-hover:scale-105 transition-transform duration-200"
                />
                <div className="flex flex-col">
                  <span className="text-xl lg:text-2xl font-bold text-gray-800 group-hover:text-amber-600 transition-colors duration-200" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    गोगटे कुलमंडळ
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              <ul className="flex items-center space-x-8">
                {/* Home */}
                <li>
                  <Link 
                    to="/" 
                    className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isActive('/') 
                        ? 'text-amber-600' 
                        : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                    onClick={e => handleProtectedNav(e, '/')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v11a1 1 0 001 1h3m-10 0h4" />
                    </svg>
                    <span>{t('common.home')}</span>
                  </Link>
                </li>

                {/* About Dropdown */}
                <li className="relative">
                  <button
                    className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      aboutDropdown 
                        ? 'text-amber-600 bg-amber-50' 
                        : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                    onMouseEnter={handleAboutMouseEnter}
                    onMouseLeave={handleAboutMouseLeave}
                    aria-expanded={aboutDropdown}
                    aria-haspopup="true"
                  >
                    <span>{t('about')}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${aboutDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {aboutDropdown && (
                    <div 
                      className="absolute top-full left-0 mt-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                      onMouseEnter={handleAboutMouseEnter}
                      onMouseLeave={handleAboutMouseLeave}
                    >
                      <div className="px-2">
                        <Link 
                          to="/kulvruttantsamiti" 
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
                          onClick={e => handleProtectedNav(e, '/kulvruttantsamiti')}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {t('kulvruttantSamiti')}
                        </Link>
                        <a 
                          href="/GogteVaatchaal.pdf" 
                          download 
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t('gogteVaatchaal')}
                        </a>
                        <Link 
                          to="/presidentsthoughts" 
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
                          onClick={e => handleProtectedNav(e, '/presidentsthoughts')}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {t('presidentsThoughts')}
                        </Link>
                        <Link 
                          to="/contact" 
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
                          onClick={e => handleProtectedNav(e, '/contact')}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {t('contact')}
                        </Link>
                      </div>
                    </div>
                  )}
                </li>

                {/* Kulavruksh */}
                <li>
                  <Link 
                    to="/kulavruksh" 
                    className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                    onClick={e => handleProtectedNav(e, '/kulavruksh')}
                  >
                    {t('kulavruksh')}
                  </Link>
                </li>

                {/* Other Dropdown */}
                <li className="relative">
                  <button
                    className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      otherDropdown 
                        ? 'text-amber-600 bg-amber-50' 
                        : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                    onMouseEnter={handleOtherMouseEnter}
                    onMouseLeave={handleOtherMouseLeave}
                    aria-expanded={otherDropdown}
                    aria-haspopup="true"
                  >
                    <span>{t('other')}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${otherDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {otherDropdown && (
                    <div 
                      className="absolute top-full left-0 mt-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                      onMouseEnter={handleOtherMouseEnter}
                      onMouseLeave={handleOtherMouseLeave}
                    >
                      <div className="px-2">
                        <a 
                          href={isLoggedIn ? "/granth" : "/login"}
                          onClick={e => {
                            if (!isLoggedIn) {
                              e.preventDefault();
                              navigate('/login');
                            }
                          }}
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          {t('granth2006')}
                        </a>
                        <a 
                          href={isLoggedIn ? "/photo-gallery" : "/login"}
                          onClick={e => {
                            if (!isLoggedIn) {
                              e.preventDefault();
                              navigate('/login');
                            }
                          }}
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {t('photoGallery')}
                        </a>
                        <a 
                          href={isLoggedIn ? "/remembrance-day" : "/login"}
                          onClick={e => {
                            if (!isLoggedIn) {
                              e.preventDefault();
                              navigate('/login');
                            }
                          }}
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t('remembranceDay')}
                        </a>
                        <a 
                          href={isLoggedIn ? "/gogte-news" : "/login"}
                          onClick={e => {
                            if (!isLoggedIn) {
                              e.preventDefault();
                              navigate('/login');
                            }
                          }}
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                          {t('news')}
                        </a>
                        <a 
                          href={isLoggedIn ? "/gogte-events" : "/login"}
                          onClick={e => {
                            if (!isLoggedIn) {
                              e.preventDefault();
                              navigate('/login');
                            }
                          }}
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {t('events')}
                        </a>
                      </div>
                    </div>
                  )}
                </li>
              </ul>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              {isLoggedIn ? (
                <>
                  {(() => {
                    const role = getUserRole();
                    console.log('Current user role:', role);
                    
                    if (role === 'dba') {
                      // DBA users only see DBA Dashboard
                      return (
                        <Link 
                          to="/dba-dashboard" 
                          className="hidden sm:inline-flex items-center px-4 py-2.5 text-red-700 bg-red-100 hover:bg-red-200 font-semibold rounded-xl shadow-sm transition-all duration-200"
                          onClick={e => handleProtectedNav(e, '/dba-dashboard')}
                        >
                          DBA Dashboard
                        </Link>
                      );
                    } else if (role === 'admin' || role === 'master_admin') {
                      // Admin users see Admin Dashboard with vansh number
                      const vansh = getUserVansh();
                      console.log('Admin vansh number:', vansh);
                      return (
                        <Link 
                          to="/admin-dashboard" 
                          className="hidden sm:inline-flex items-center px-4 py-2.5 text-purple-700 bg-purple-100 hover:bg-purple-200 font-semibold rounded-xl shadow-sm transition-all duration-200"
                          onClick={e => handleProtectedNav(e, '/admin-dashboard')}
                        >
                          {vansh ? `Admin Dashboard ${vansh}` : 'Admin Dashboard'}
                        </Link>
                      );
                    } else {
                      // Regular users see regular Dashboard
                      return (
                        <Link 
                          to="/dashboard" 
                          className="hidden sm:inline-flex items-center px-4 py-2.5 text-amber-700 bg-amber-100 hover:bg-amber-200 font-semibold rounded-xl shadow-sm transition-all duration-200"
                          onClick={e => handleProtectedNav(e, '/dashboard')}
                        >
                          Dashboard
                        </Link>
                      );
                    }
                  })()}
                  <button 
                    className="hidden sm:inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2"
                    onClick={requestLogout}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="hidden sm:inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  {t('loginRegister')}
                </Link>
              )}
              
              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg rounded-b-3xl mt-2">
          <div className="px-4 py-6 space-y-4">
            {/* Home */}
            <Link 
              to="/" 
              className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'text-amber-600 bg-amber-50' 
                  : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
              }`}
              onClick={e => { handleProtectedNav(e, '/'); setMenuOpen(false); }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v11a1 1 0 001 1h3m-10 0h4" />
              </svg>
              Home
            </Link>

            {/* About Section */}
            <div className="space-y-2">
              <div className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {t('about')}
              </div>
              <Link 
                to="/kulvruttantsamiti" 
                className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                onClick={e => { handleProtectedNav(e, '/kulvruttantsamiti'); setMenuOpen(false); }}
              >
                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('kulvruttantSamiti')}
              </Link>
              <a 
                href="/GogteVaatchaal.pdf" 
                download 
                className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('gogteVaatchaal')}
              </a>
              <Link 
                to="/presidentsthoughts" 
                className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                onClick={e => { handleProtectedNav(e, '/presidentsthoughts'); setMenuOpen(false); }}
              >
                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {t('presidentsThoughts')}
              </Link>
              <Link 
                to="/contact" 
                className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                onClick={e => { handleProtectedNav(e, '/contact'); setMenuOpen(false); }}
              >
                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {t('contact')}
              </Link>
            </div>

            {/* Other Section */}
            <div className="space-y-2">
              <div className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {t('other')}
              </div>
              <a 
                href="/kulavruksh" 
                className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t('kulavruksh')}
              </a>
              <a 
                href="#granth-2006" 
                className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {t('granth2006')}
              </a>
              <a 
                href="#photo-gallery" 
                className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('photoGallery')}
              </a>
            </div>

            {/* Login/Logout for Mobile */}
            <div className="pt-4">
              {isLoggedIn ? (
                <button 
                  className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => { setMenuOpen(false); requestLogout(); }}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  {t('loginRegister')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 relative">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Logout</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
