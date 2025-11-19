import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const SkipToContent = () => {
  const { t } = useLanguage();

  return (
    <a href="#main-content" className="skip-to-content">
      {t('accessibility.skipToContent')}
    </a>
  );
};

export default SkipToContent;