import { createContext, useContext } from 'react';

interface LanguageContextType {
  language: 'en' | 'es';
  setLanguage?: (lang: 'en' | 'es') => void;
}

export const LanguageContext = createContext<LanguageContextType>({ language: 'en' });

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};