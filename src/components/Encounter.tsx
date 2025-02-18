import React from 'react';
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
        {/* Speech-to-Text Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {language === 'en' ? 'Speech to Text' : 'Voz a Texto'}
          </h2>

          <p className="text-gray-200 font-medium mb-6">
            {language === 'en'
              ? 'Speak in English and see the Spanish translation below.'
              : 'Hable en inglés y vea la traducción al español a continuación.'}
          </p>

          <EncounterListen language={language} />
        </div>

        {/* Button Responses Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {language === 'en' ? 'Button Responses' : 'Respuestas Predefinidas'}
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