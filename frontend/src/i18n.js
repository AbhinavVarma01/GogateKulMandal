import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import mrTranslations from './locales/mr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en', // Set default language to English
    resources: {
      en: { translation: enTranslations },
      mr: { translation: mrTranslations }
    },
    interpolation: { escapeValue: false }
  });

export default i18n;
