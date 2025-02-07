import React, { useState } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { translations } from '../translations';
import EncounterPremadeButtons from './EncounterPremadeButtons';
import AudioPlayer from './AudioPlayer';

interface EncounterProps {
  language?: 'en' | 'es';
}

const Encounter = ({ language = 'en' }: EncounterProps) => {
  const [error, setError] = useState<string | null>(null);
  
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
        {/* Listen Mode Section */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            {language === 'en' ? 'Listen Mode' : 'Modo de Escucha'}
          </h2>

          <p className="text-gray-300 mb-4">
            {language === 'en'
              ? 'Use this mode to listen and translate English speech to Spanish text.'
              : 'Use este modo para escuchar el habla en inglés y traducirlo a texto en español.'}
          </p>

          <div className="space-y-4">
            <button
              onClick={() => {}}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Mic size={20} />
              {language === 'en' ? 'Start Listening' : 'Comenzar a Escuchar'}
            </button>
          </div>
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

          {error && (
            <div className="bg-red-900/50 text-red-100 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <AudioPlayer />
        </div>
      </div>
    </div>
  );
};

export default Encounter;