import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiLogin } from '../utils/api';
import { useNavigate } from 'react-router-dom';


const LoginRegisterPage = () => {
  const navigate = useNavigate();
  const [showText, setShowText] = useState(false);
  const hoverText = `परशुराम हा जमदग्नी आणि रेणुकेचा मुलगा होता. जमदग्नी ब्राह्मण होता तर रेणुका क्षत्रिय अर्थात योद्धा कुळातील होती. परशुराम हा शिवाचा महान उपासक होता. शस्त्रविद्येत पारंगत असलेला परशुराम गुरु द्रोणाचार्य, कर्ण आणि अर्जुन या महापुरुषांचा तो शिक्षक होता असे मानले जाते. त्याने चित्पावन ब्राह्मण नावाच्या एका लहान समुदायाची चौदा गोत्र निर्माण केली. परशुरामाने चित्पावन ब्राह्मणांना वेद, युद्धनीती आणि युद्ध कला शिकवली. चित्पावन ब्राह्मण परशुरामांना "आदिपुरुष" किंवा मूळ पुरुष म्हणून संबोधतात.`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);


  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiLogin(email, password);
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('user', JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem('rememberLogin', JSON.stringify({ email, password, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
      } else {
        localStorage.removeItem('rememberLogin');
      }
      
      // Redirect based on user role
      if (user.role === 'dba') {
        window.location.href = '/dba-dashboard';
      } else if (user.role === 'admin' || user.role === 'master_admin') {
        window.location.href = '/admin-dashboard';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleRegisterClick() {
    navigate('/register');
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Loading Spinner Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <LoadingSpinner />
            <p className="text-xl font-semibold text-gray-700">Logging in...</p>
          </div>
        </div>
      )}
      
      {/* Google Fonts Import */}
      <link href="https://fonts.googleapis.com/css2?family=Amita:wght@700&display=swap" rel="stylesheet" />
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden z-10">
        {/* Main Content (title, subtitle, Parashurama image, and login/register form in one row) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between py-20 w-full">
            {/* Image + Text Block (HomePage style) */}
            <div className="lg:w-1/2 flex flex-row items-center gap-12">
              <div
                className="flex-shrink-0 -ml-2 md:ml-4 relative inline-block"
                onMouseEnter={() => setShowText(true)}
                onMouseLeave={() => setShowText(false)}
                tabIndex={0}
                onFocus={() => setShowText(true)}
                onBlur={() => setShowText(false)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src="/parashurama.jpg"
                  alt="Parashurama"
                  className="h-[450px] w-auto rounded-xl object-contain shadow-xl border-4 border-white"
                />
                {showText && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl p-6 transition-opacity duration-300 opacity-100"
                    style={{ pointerEvents: 'none' }}>
                    <span
                      className="text-white text-base md:text-lg font-semibold text-center leading-relaxed"
                      style={{ fontFamily: 'Gotu, serif', textShadow: '0 2px 8px #000' }}
                    >
                      {hoverText}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-left space-y-6">
                <h1
                  className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-tight drop-shadow-lg"
                  style={{ fontFamily: 'Amita, cursive' }}
                >
                  गोगटे कुलमंडळ
                </h1>
                <div className="h-4"></div>
                <p className="text-lg md:text-2xl text-white/90 max-w-2xl drop-shadow">
                  Discover the rich heritage and spiritual journey of the Gogte Family
                </p>
              </div>
            </div>
            <div className="w-full lg:w-auto flex justify-center lg:justify-end mt-12 lg:mt-0 lg:ml-auto lg:mr-[-60px] lg:pr-0">
              <div className="bg-white/90 rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col items-center overflow-hidden">
                <h1 className="text-3xl md:text-4xl font-extrabold text-amber-700 mb-6" style={{ fontFamily: 'Amita, cursive' }}>Login</h1>
                <form className="w-full space-y-4" onSubmit={handleLogin} autoComplete="off">
                  {/* Hidden decoy fields to discourage browser autofill */}
                  <input type="text" name="username" autoComplete="username" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />
                  <input type="password" name="password" autoComplete="current-password" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />
                  {error && (
                    <div className="w-full bg-red-50 text-red-700 px-3 py-2 rounded border border-red-200 text-sm">{error}</div>
                  )}
                  {success && (
                    <div className="w-full bg-green-50 text-green-700 px-3 py-2 rounded border border-green-200 text-sm">{success}</div>
                  )}
                  <input
                    type="text"
                    name="login_email_custom"
                    autoComplete="username"
                    placeholder="Username"
                    className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 text-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="login_password_custom"
                      autoComplete="off"
                      placeholder="Password"
                      className="w-full px-4 py-2 pr-24 border border-amber-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 text-lg"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-amber-700 px-3 py-1 rounded hover:bg-amber-50"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    Remember me
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-amber-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-lg disabled:opacity-60"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                  <div className="text-center text-gray-600 text-sm">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={handleRegisterClick}
                      className="text-amber-600 font-semibold hover:text-amber-700 underline"
                    >
                      Register here
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LoginRegisterPage;
