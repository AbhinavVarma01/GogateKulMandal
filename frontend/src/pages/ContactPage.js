import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';

const ContactPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-2 w-full">
        <div className="w-full flex justify-end max-w-4xl mb-6">
          <Link
            to="/dashboard"
            className="inline-block px-7 py-2 bg-amber-500 text-white font-semibold rounded-full shadow hover:bg-amber-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 animate-bounce-in"
          >
            {t('contactPage.backToDashboard')}
          </Link>
        </div>
        <div className="flex flex-col lg:flex-row items-center w-full max-w-6xl gap-8">
          {/* Office Image */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-amber-200">
              <img 
                src="/KulMandalOffice.jpg" 
                alt="Kul Mandal Office" 
                className="w-full max-w-lg rounded-xl shadow-lg"
              />
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-xl p-10 w-full flex flex-col items-center border border-amber-200">
              <h2 className="text-2xl md:text-3xl font-extrabold text-amber-700 mb-6 tracking-wide text-center">
                {t('contactPage.title')}
              </h2>
              
              <div className="flex flex-col items-center gap-4 mb-8 w-full">
                <div className="text-center">
                  <span className="text-xl md:text-2xl font-bold text-gray-900 block mb-2">
                    {t('contactPage.president')}
                  </span>
                  <span className="text-base md:text-lg text-gray-700 text-center leading-relaxed">
                    {t('contactPage.address')}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-3 text-lg text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a2 2 0 011.94 1.515l.516 2.064a2 2 0 01-1.516 2.485l-2.197.44c.273.894.707 1.746 1.283 2.522a11.042 11.042 0 004.522 4.522c.776.576 1.628 1.01 2.522 1.283l.44-2.197A2 2 0 0115.42 13.26l2.064.516A2 2 0 0119 15.72V19a2 2 0 01-2 2h-1C9.163 21 3 14.837 3 7V5z" />
                  </svg>
                  <span className="font-medium">{t('contactPage.mobile')}</span>
                  <span className="ml-1 font-semibold text-gray-900">{t('contactPage.mobileNumber')}</span>
                </div>
                
                <div className="flex items-center gap-3 text-lg text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm2 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                  <span className="font-medium">{t('contactPage.email')}</span>
                  <a href="mailto:gogtekulam@gmail.com" className="ml-1 text-blue-700 underline hover:text-blue-800 transition-colors">
                    {t('contactPage.emailAddress')}
                  </a>
                </div>
                
                <div className="mt-4">
                  <a 
                    href="https://maps.app.goo.gl/vS16GPFTEG1A6mJr9?g_st=aw" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('contactPage.viewOnMap')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
