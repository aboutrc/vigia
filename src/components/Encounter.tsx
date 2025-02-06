import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import { Mic, Volume2, MicOff } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface EncounterProps {
  language?: 'en' | 'es';
}

const Encounter = ({ language = 'en' }: EncounterProps) => {
  const [error, setError] = useState<string | null>(null);
  const [englishText, setEnglishText] = useState('');
  const [spanishText, setSpanishText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const {
    isListening,
    transcript,
    error: speechError,
    hasPermission,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechToText({
    continuous: true,
    language: 'en-US'
  });

  const t = translations[language];

  const translateText = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      setIsTranslating(true);
      
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`
      );

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      
      if (data.responseStatus === 200) {
        setSpanishText(data.responseData.translatedText);
      } else {
        throw new Error('Translation failed');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (transcript) {
      setEnglishText(transcript);
      translateText(transcript);
    }
  }, [transcript]);

  const toggleListening = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      if (isListening) {
        stopListening();
        resetTranscript();
        setEnglishText('');
        setSpanishText('');
      } else {
        await startListening();
      }
    } catch (err) {
      console.error('Failed to toggle listening:', err);
      setError('Failed to start speech recognition. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (speechError && speechError !== 'aborted') {
      setError(speechError);
    }
  }, [speechError]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
            {hasPermission === false ? <MicOff className="mr-2 text-red-500" /> : <Mic className="mr-2" />}
            ENGLISH TO SPANISH TRANSLATION
          </h2>

          <div className="bg-black/30 rounded-lg mb-4 p-4">
            {/* Visualization Area */}
            {isListening && (
              <div className="flex items-center justify-center space-x-1 h-8 mb-4">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500/50 rounded-full animate-soundbar"
                    style={{
                      height: '32px',
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Text Display Area */}
            <div className="space-y-4">
              {/* English Section */}
              <div>
                <div className="text-sm font-medium text-gray-400 mb-1">English:</div>
                <p className="text-gray-100">
                  {isProcessing ? (
                    <span className="text-blue-400">Processing speech...</span>
                  ) : englishText || (
                    hasPermission === false ? 
                      'Microphone access required' : 
                      'Click Record to start speaking...'
                  )}
                </p>
              </div>

              {/* Spanish Section */}
              {englishText && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Español:</div>
                  <p className="text-gray-100">
                    {isTranslating ? (
                      <span className="text-blue-400">Traduciendo...</span>
                    ) : (
                      spanishText || '...'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 text-red-100 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={toggleListening}
              disabled={isProcessing || hasPermission === false}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : hasPermission === false
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : isProcessing
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {hasPermission === false ? 'MICROPHONE BLOCKED' :
               isProcessing ? 'PROCESSING...' : 
               isListening ? 'STOP' : 'RECORD'}
            </button>
          </div>
        </div>

        <div className="text-center text-gray-400 text-sm mt-4">
          {t.encounter?.speakInstructions || 'Speak in English to translate to Spanish'}
        </div>
      </div>
    </div>
  );
}

export default Encounter;