import React, { useState, useRef } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { audioStatements } from '../lib/audioStatements';

interface AudioPlayerProps {
  speakerMode?: boolean;
}

const AudioPlayer = ({ speakerMode = false }: AudioPlayerProps) => {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeakerMode, setIsSpeakerMode] = useState(speakerMode);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const maxRetries = 3;
  const retryDelay = 2000;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generateAndPlaySpeech = async (text: string) => {
    try {
      if (currentPlaying === text) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setCurrentPlaying(null);
        return;
      }

      setIsGenerating(true);
      setError(null);
      
      const generateSpeech = async (attempt: number): Promise<Blob> => {
        try {
          const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pqHfZKP75CvOlQylNhV4', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability: 0.75,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
              }
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.blob();
        } catch (err) {
          if (attempt < maxRetries) {
            await delay(retryDelay);
            return generateSpeech(attempt + 1);
          }
          throw err;
        }
      };

      const blob = await generateSpeech(1);
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      audioRef.current.volume = isSpeakerMode ? 1.0 : 0.3;
      
      audioRef.current.onended = () => {
        setCurrentPlaying(null);
        URL.revokeObjectURL(url);
      };

      await audioRef.current.play();
      setCurrentPlaying(text);
    } catch (err) {
      console.error('Speech generation error:', err);
      setError('Failed to generate speech. Please try again.');
      setCurrentPlaying(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSpeakerMode = () => {
    setIsSpeakerMode(!isSpeakerMode);
    if (audioRef.current) {
      audioRef.current.volume = !isSpeakerMode ? 1.0 : 0.3;
    }
  };

  return (
    <div className="w-full max-w-2xl mt-8">
      {error && (
        <div className="bg-red-900/50 text-red-100 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100 flex items-center">
          <Volume2 className="mr-2" />
          Press play to hear the phrase in English
        </h2>
        <button
          onClick={toggleSpeakerMode}
          className={`p-2 rounded-lg transition-colors ${
            isSpeakerMode 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isSpeakerMode ? 'Speaker Mode On' : 'Speaker Mode Off'}
        >
          {isSpeakerMode ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

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
                  <p className="text-sm text-gray-400">
                    <Volume2 className="inline-block mr-1" size={14} />
                    Click to play
                  </p>
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
                  <Play size={20} />
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
      </div>
    </div>
  );
};

export default AudioPlayer;