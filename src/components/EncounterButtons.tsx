import React from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { translations } from '../translations';

interface EncounterButtonsProps {
  isListening: boolean;
  isSpeakMode: boolean;
  onListenClick: () => void;
  onSpeakClick: () => void;
  language?: 'en' | 'es';
}

const EncounterButtons = ({
  isListening,
  isSpeakMode,
  onListenClick,
  onSpeakClick,
  language = 'en'
}: EncounterButtonsProps) => {
  const t = translations[language];

  return (
    <div className="w-full max-w-md grid grid-cols-2 gap-4">
      <button
        onClick={onListenClick}
        className={`flex flex-col items-center justify-center py-3 px-4 text-gray-300 hover:bg-gray-800 transition-colors rounded-lg bg-black ${
          isListening && !isSpeakMode ? 'bg-gray-800 ring-2 ring-blue-500' : ''
        }`}
      >
        <Mic size={20} className={`mb-1 ${isListening && !isSpeakMode ? 'text-blue-400' : ''}`} />
        <span className="text-xs font-medium">
          {isListening && !isSpeakMode ? 'Stop Listening' : 'Listen Mode'}
        </span>
      </button>

      <button
        onClick={onSpeakClick}
        className={`flex flex-col items-center justify-center py-3 px-4 text-gray-300 hover:bg-gray-800 transition-colors rounded-lg bg-black ${
          isListening && isSpeakMode ? 'bg-gray-800 ring-2 ring-blue-500' : ''
        }`}
      >
        <Volume2 size={20} className={`mb-1 ${isListening && isSpeakMode ? 'text-blue-400' : ''}`} />
        <span className="text-xs font-medium">
          {isListening && isSpeakMode ? 'Stop Speaking' : 'Speak Mode'}
        </span>
      </button>
    </div>
  );
};

export default EncounterButtons;