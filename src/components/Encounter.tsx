import React, { useState } from 'react';
import { translations } from '../translations';
import AudioPlayer from './AudioPlayer';
import EncounterListen from './EncounterListen';

interface EncounterProps {
  language?: 'en' | 'es';
}

const Encounter = ({ language = 'en' }: EncounterProps) => {
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* English to Spanish Translation Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {language === 'en' ? 'English to Spanish Translation' : 'Traducción de Inglés a Español'}
          </h2>
          <p className="text-gray-200 font-medium mb-4">
            {language === 'en'
              ? 'Click record to listen for English speech and see Spanish translation.'
              : 'Haga clic en grabar para escuchar el habla en inglés y ver la traducción al español.'}
          </p>
          <EncounterListen language={language} />
        </div>

        {/* Button Responses Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {language === 'en' ? 'Pre-recorded Responses' : 'Respuestas Pregrabadas'}
          </h2>
          <p className="text-gray-200 font-medium mb-4">
            {language === 'en'
              ? 'Click the buttons below to play pre-recorded responses in English.'
              : 'Haga clic en los botones para reproducir respuestas pregrabadas en inglés.'}
          </p>
          <AudioPlayer useEncounterStatements={true} language={language} />
        </div>
      </div>
    </div>
  );
};

export default Encounter;