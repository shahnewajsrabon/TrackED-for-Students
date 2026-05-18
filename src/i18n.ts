import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
import enTranslations from './locales/en.json';
// Bengali translations
import bnTranslations from './locales/bn.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      bn: { translation: bnTranslations },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
