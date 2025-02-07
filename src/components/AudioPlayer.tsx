import React, { useState, useRef } from 'react';
import { Play, Volume2 } from 'lucide-react';

interface AudioFile {
  title: string;
  text: string;
  description: string;
}

interface AudioPlayerProps {
  speakerMode?: boolean;
}

const audioFiles: AudioFile[] = [
  {
    title: "Fifth Amendment Rights",
    text: "I do not wish to speak with you, answer your questions, or sign or hand you any documents, based on my Fifth Amendment rights under the United States Constitution.",
    description: "Invoke Fifth Amendment rights"
  },
  {
    title: "Fourth Amendment Rights",
    text: "I do not give you permission to enter my home, based on my Fourth Amendment rights under the United States Constitution, unless you have a warrant to enter, signed by a judge or magistrate, with my name on it that you slide under the door.",
    description: "Invoke Fourth Amendment rights"
  },
  {
    title: "Warrant Request",
    text: "Please slide the warrant to enter, signed by a judge or magistrate, with my name on it that you slide under the door. If you do not have one, I do not wish to speak with you, answer your questions, or sign or hand you any documents, based on my Fifth Amendment rights under the United States Constitution.",
    description: "Request warrant under door"
  },
  {
    title: "Search Permission",
    text: "I do not give you permission to search any of my belongings based on my 4th amendment rights.",
    description: "Deny search permission"
  },
  {
    title: "Identify Authority",
    text: "Can you please identify yourself. Are you with local law enforcement or with Immigration and Customs Enforcement.",
    description: "Request authority identification"
  },
  {
    title: "Badge Numbers",
    text: "I would request badge numbers from all officers present.",
    description: "Request badge numbers"
  }
];

const AudioPlayer = ({ speakerMode = false }: AudioPlayerProps) => {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        throw new Error('Failed to generate speech');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      audioRef.current.volume = speakerMode ? 1.0 : 0.3;
      
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

  return (
    <div className="w-full max-w-2xl mt-8">
      {error && (
        <div className="bg-red-900/50 text-red-100 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="grid gap-4">
        {audioFiles.map((audio) => {
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