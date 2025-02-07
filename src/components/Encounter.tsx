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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Speech-to-Text Section */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            {language === 'en' ? 'Speech to Text' : 'Voz a Texto'}
          </h2>

          <p className="text-gray-300 mb-6">
            {language === 'en'
              ? 'Speak in English and see the Spanish translation below.'
              : 'Hable en inglés y vea la traducción al español a continuación.'}
          </p>

          <EncounterListen language={language} />
        </div>

        {/* Button Responses Section */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            {language === 'en' ? 'Button Responses' : 'Respuestas Predefinidas'}
          </h2>

          <p className="text-gray-300 mb-4">
            {language === 'en'
              ? 'Click the buttons below to play pre-recorded responses in English.'
              : 'Haga clic en los botones para reproducir respuestas pregrabadas en inglés.'}
          </p>

          <AudioPlayer />
        </div>
      </div>
    </div>
  );
};

export default Encounter;