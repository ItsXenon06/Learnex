import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import vi from './vi.json';

const resources = {
  en: { translation: en },
  vi: { translation: vi }
};

const savedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem('learnex_lang') : null;
const defaultLanguage = savedLanguage || (typeof navigator !== 'undefined' && navigator.language?.startsWith('vi') ? 'vi' : 'en');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;
