import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';

const VyadeshwarPage = () => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log('Video play error:', e));
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-100 to-red-100">
      
      {/* Audio warning message */}
      <div className="flex flex-col items-center my-4">
        <span className="text-sm text-gray-700 mb-2">Hover over the image to see the video and connect to speakers or headphones to hear the audio.</span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* Left Half: Full Height Image with Video Overlay */}
        <div className="md:w-1/2 w-full flex items-center justify-center h-[28rem] md:h-[44rem] bg-transparent">
          <div 
            className="relative w-96 h-96 md:w-[34rem] md:h-[34rem] mt-8 md:mt-20 border-8 border-orange-300 md:rounded-r-none rounded-b-3xl md:rounded-b-none md:rounded-l-3xl shadow-2xl overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Static Image */}
            <img
              src="/Vyadeshwar_swamy.jpg"
              alt={t('vyadeshwar.title')}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                isHovered ? 'opacity-0' : 'opacity-100'
              }`}
            />
            
            {/* Video Overlay */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <video
                ref={videoRef}
                width="100%"
                height="100%"
                loop
                playsInline
                className="w-full h-full object-contain bg-black"
                style={{ transform: 'scaleX(-1)' }}
              >
                <source src="/Vyadeshwar_aarthi.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
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
              {t('vyadeshwar.title')}
            </h2>
            <p className="text-lg text-gray-800 mb-6 font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
              {t('vyadeshwar.para1')}
            </p>
            <p className="text-lg text-gray-800 mb-6 font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
              {t('vyadeshwar.para2')}
            </p>
            <p className="text-lg text-gray-800 mb-6 font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
              {t('vyadeshwar.para3')}
            </p>
            <p className="text-lg text-gray-800 font-sans" style={{ fontFamily: 'Montserrat, Open Sans, Arial, sans-serif' }}>
              {t('vyadeshwar.para4')}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VyadeshwarPage;