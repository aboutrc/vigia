import React from 'react';
import { translations } from '../translations';

interface RegistroProps {
  language?: 'en' | 'es';
}

const Registro = ({ language = 'en' }: RegistroProps) => {
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-4">
          {language === 'en' ? 'Proof/Registro' : 'Prueba/Registro'}
        </h1>
        <p className="text-gray-300">
          {language === 'en'
            ? 'This feature is coming soon...'
            : 'Esta función estará disponible pronto...'}
        </p>
      </div>
    </div>
  );
};

export default Registro;