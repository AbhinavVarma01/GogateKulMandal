import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 shadow flex items-center"
        aria-label="Switch Language"
      >
        <span className="material-icons text-gray-600">Translate</span>
        <span className="ml-1">&#x25BE;</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-28 bg-white rounded shadow-lg z-50">
          <div
            className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900"
            onClick={() => { i18n.changeLanguage('en'); setOpen(false); }}
          >
            English
          </div>
          <div
            className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900"
            onClick={() => { i18n.changeLanguage('mr'); setOpen(false); }}
          >
            मराठी
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 