import React, { useState } from 'react';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import PhotoScroller from '../components/PhotoScroller';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { t } = useTranslation();
  const [showText, setShowText] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const hoverText = `परशुराम हा जमदग्नी आणि रेणुकेचा मुलगा होता. जमदग्नी ब्राह्मण होता तर रेणुका क्षत्रिय अर्थात योद्धा कुळातील होती. परशुराम हा शिवाचा महान उपासक होता. शस्त्रविद्येत पारंगत असलेला परशुराम गुरु द्रोणाचार्य, कर्ण आणि अर्जुन या महापुरुषांचा तो शिक्षक होता असे मानले जाते. त्याने चित्पावन ब्राह्मण नावाच्या एका लहान समुदायाची चौदा गोत्र निर्माण केली. परशुरामाने चित्पावन ब्राह्मणांना वेद, युद्धनीती आणि युद्ध कला शिकवली. चित्पावन ब्राह्मण परशुरामांना "आदिपुरुष" किंवा मूळ पुरुष म्हणून संबोधतात.`;

  const handleMissionClick = () => {
    setShowVideo(true);
  };

  const closeVideo = () => {
    setShowVideo(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Google Fonts Import */}
      <link href="https://fonts.googleapis.com/css2?family=Amita:wght@700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden z-10">
        {/* Grid of Quick Links - absolutely positioned in top right of hero section */}
        <div className="hidden lg:block absolute top-20 right-20 z-20">
          <div className="flex flex-col gap-4 max-w-sm">
            {[
              { to: "/vyadeshwar", img: "/Vyadeshwar_swamy.jpg", title: t('homepage.grid.vyadeshwar') },
              { to: "/yogeshwaridevi", img: "/Yogeshwari_devi.jpg", title: t('homepage.grid.yogeshwari') },
            ].map((item, index) => (
              <Link
                key={index}
                to={item.to || '#'}
                className={`group flex flex-col items-center p-4 rounded-2xl transition-all duration-300 opacity-80`}
              >
                <div className="relative mb-3 group">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="relative w-40 h-40 object-cover rounded-full shadow-lg z-10 border-4 border-white ring-0 group-hover:ring-4 group-hover:ring-amber-500 transition"
                  />
                </div>
                <span className="text-base font-semibold text-white text-center mt-2">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
        {/* Mobile/Tablet: grid below hero content */}
        <div className="block lg:hidden absolute left-1/2 transform -translate-x-1/2 top-[calc(100vw/2.2)] z-20 -ml-12">
          <div className="flex flex-col gap-4 max-w-sm">
            {[
              { to: "/vyadeshwar", img: "/Vyadeshwar_swamy.jpg", title: t('homepage.grid.vyadeshwar') },
              { to: "/yogeshwaridevi", img: "/Yogeshwari_devi.jpg", title: t('homepage.grid.yogeshwari') },
            ].map((item, index) => (
              <Link
                key={index}
                to={item.to || '#'}
                className={`group flex flex-col items-center p-4 rounded-2xl transition-all duration-300 opacity-80`}
              >
                <div className="relative mb-3 group">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="relative w-40 h-40 object-cover rounded-full shadow-lg z-10 border-4 border-white ring-0 group-hover:ring-4 group-hover:ring-amber-500 transition"
                  />
                </div>
                <span className="text-base font-semibold text-white text-center mt-2">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-center -mt-12">
            <div className="lg:w-1/2 flex flex-row items-center gap-12 lg:translate-x-32">
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
                  className="h-[450px] w-auto rounded-xl object-contain shadow-xl border border-white"
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
                  className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white drop-shadow-lg"
                  style={{ fontFamily: 'Amita, cursive', lineHeight: '1.12em' }}
                >
                  {t('homepage.title')}
                </h1>
                <div className="h-4"></div>
                <p className="text-lg md:text-2xl text-white/90 max-w-2xl drop-shadow" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {t('homepage.subtitle')}
                </p>
              </div>
            </div>
            <div className="lg:w-1/2"></div>
          </div>
        </div>
      </section>

      {/* ध्येय Section - Clickable for YouTube Video */}
      <section className="w-full flex justify-center items-center py-8 -mt-20">
        <div 
          className="bg-gradient-to-br from-amber-100 to-orange-200 shadow-xl rounded-2xl px-8 py-6 flex flex-col items-center max-w-2xl w-full border-2 border-amber-300 relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          onClick={handleMissionClick}
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-2 left-2 w-12 h-12 bg-amber-400 rounded-full"></div>
            <div className="absolute bottom-2 right-2 w-10 h-10 bg-orange-400 rounded-full"></div>
            <div className="absolute top-1/2 left-4 w-8 h-8 bg-amber-300 rounded-full"></div>
            <div className="absolute top-1/2 right-4 w-6 h-6 bg-orange-300 rounded-full"></div>
          </div>
          <div className="relative z-10 text-center flex flex-col items-center">
            <img src="/aim.png" alt="Mission" className="w-24 h-24 mb-4" />
            <h2 className="text-4xl md:text-5xl font-bold text-amber-800 mb-2 tracking-tight drop-shadow-lg" style={{ fontFamily: 'Amita, cursive' }}>
              {t('homepage.mission.title')}
            </h2>
            <p className="text-lg text-gray-700 mb-4 text-center max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t('homepage.mission.subtitle')}
            </p>
            <p className="text-base text-gray-600 mb-6 text-center max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t('homepage.mission.description')}
            </p>
            <button
              className="text-xl md:text-2xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 rounded-full shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transform hover:scale-105"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('homepage.mission.button')}
            </button>
          </div>
        </div>
      </section>

      {/* PhotoScroller below the ध्येय section */}
      <div className="w-full flex justify-center items-center py-4">
        <PhotoScroller enableClick={false} />
      </div>

      {/* YouTube Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={closeVideo}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/BeqKkGYCWPk?autoplay=1"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HomePage;



