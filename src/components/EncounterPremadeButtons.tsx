import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, MessageSquarePlus } from 'lucide-react';
import { audioCache } from '../lib/audioCache';
import { audioStatements } from '../lib/audioStatements';
import { translations } from '../translations';

interface EncounterPremadeButtonsProps {
  speakerMode?: boolean;
}

const EncounterPremadeButtons = ({ speakerMode = false }: EncounterPremadeButtonsProps) => {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedMessage, setTranslatedMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentPlaying(null);
    }
  };

  const translateToEnglish = async (spanishText: string): Promise<string> => {
    try {
      setIsTranslating(true);
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: spanishText,
            source: 'es',
            target: 'en',
            format: 'text'
          })
        }
      );

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (err) {
      console.error('Translation error:', err);
      throw new Error('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const generateAndPlaySpeech = async (text: string, isCustom = false) => {
    try {
      if (!text.trim()) return;

      if (currentPlaying === text) {
        stopCurrentAudio();
        return;
      }

      stopCurrentAudio();
      setIsGenerating(true);
      setError(null);

      let audioText = text;
      if (isCustom) {
        try {
          audioText = await translateToEnglish(text);
          setTranslatedMessage(audioText);
        } catch (err) {
          setError('Translation failed. Please try again.');
          return;
        }
      }

      const audioUrl = await audioCache.getAudio(audioText);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = audioUrl;
      audioRef.current.volume = speakerMode ? 1.0 : 0.3;
      
      audioRef.current.onended = () => {
        setCurrentPlaying(null);
      };

      await audioRef.current.play();
      setCurrentPlaying(text);
    } catch (err) {
      console.error('Speech playback error:', err);
      setError('Failed to play speech. Please try again.');
      setCurrentPlaying(null);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mt-8">
      <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
        <Volume2 className="mr-2" />
        Press play to hear the phrase in English
      </h2>
      
      {error && (
        <div className="bg-red-900/50 text-red-100 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="grid gap-4">
        {audioStatements.map((audio) => {
          const isPlaying = currentPlaying === audio.text;
          const isDisabled = isGenerating && currentPlaying !== audio.text;

          return (
            <div
              key={audio.title}
              className="bg-black/30 backdrop-blur-sm rounded-lg p-4 hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-100">{audio.title}</h3>
                </div>
                <button
                  onClick={() => generateAndPlaySpeech(audio.text)}
                  disabled={isDisabled}
                  className={`p-3 rounded-full transition-colors ${
                    isPlaying 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : isDisabled
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  }`}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>
              <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-blue-500 rounded-full transition-all duration-200 ${
                    isPlaying ? 'animate-progress' : ''
                  }`}
                  style={{ width: isPlaying ? '100%' : '0%' }}
                />
              </div>
            </div>
          );
        })}

        {/* Custom Spanish Input */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 hover:bg-black/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-medium text-gray-100">Custom Message</h3>
              <p className="text-sm text-gray-400">Write your message in Spanish</p>
            </div>
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="p-3 rounded-full transition-colors bg-gray-700 hover:bg-gray-600 text-gray-100"
            >
              <MessageSquarePlus size={20} />
            </button>
          </div>

          {showCustomInput && (
            <div className="space-y-3">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Escriba su mensaje en español..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                rows={3}
              />
              {translatedMessage && (
                <div className="text-sm text-gray-400 italic">
                  Translation: {translatedMessage}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => generateAndPlaySpeech(customMessage, true)}
                  disabled={!customMessage.trim() || isDisabled}
                  className={`p-3 rounded-full transition-colors ${
                    isPlaying 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : !customMessage.trim() || isDisabled
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  }`}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncounterPremadeButtons;