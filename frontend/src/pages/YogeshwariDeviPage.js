import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';

import { useEffect, useRef } from 'react';

const YogeshwariDeviPage = () => {
  const { t } = useTranslation();
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((e) => {
        // Handle autoplay restrictions or errors
        console.log('Audio play error:', e);
      });
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-100 to-red-100">

      {/* Audio autoplay and message */}
      <div className="flex flex-col items-center my-4">
        <span className="text-sm text-gray-700 mb-2">Please be connected to speakers or headphones to hear the audio.</span>
        <audio ref={audioRef} src="/YogeshwariDevi.mp3" autoPlay controls />
      </div>

      {/* Page content */}
      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* Left Half: Full Height Image */}
        <div className="md:w-1/2 w-full flex items-center justify-center h-[28rem] md:h-[44rem] bg-transparent">
          <img
            src="/Yogeshwari_devi.jpg"
            alt={t('yogeshwaridevi.title')}
            className="w-96 h-96 md:w-[34rem] md:h-[34rem] mt-8 md:mt-20 object-cover border-8 border-orange-300 md:rounded-r-none rounded-b-3xl md:rounded-b-none md:rounded-l-3xl shadow-2xl"
          />
        </div>
        {/* Right Half: Information */}
        <div className="md:w-1/2 w-full flex flex-col justify-between bg-white bg-opacity-80 p-10 md:p-16 animate-slide-in-right">
          <div className="flex justify-end mb-6">
            <Link
              to="/"
              className="inline-block px-7 py-2 bg-orange-500 text-white font-semibold rounded-full shadow hover:bg-orange-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 animate-bounce-in"
            >
              ← Back to Home
            </Link>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-5xl font-extrabold text-orange-900 mb-6 tracking-tight drop-shadow-lg font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
              {t('yogeshwaridevi.title')}
            </h2>
            <p className="text-lg text-gray-800 mb-6 font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
              {t('yogeshwaridevi.para1')}
            </p>
            <p className="text-lg text-gray-800 mb-6 font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
              {t('yogeshwaridevi.para2')}
            </p>
            <p className="text-lg text-gray-800 mb-6 font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
              {t('yogeshwaridevi.para3')}
            </p>
            <p className="text-lg text-gray-800 font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
              {t('yogeshwaridevi.para4')}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default YogeshwariDeviPage;