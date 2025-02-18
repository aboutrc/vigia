import React, { useState, useRef, useEffect } from 'react';
import { translations } from '../translations';

interface EncounterSpeakProps {
  isActive: boolean;
  onError: (error: string | null) => void;
  isSpeakerMode: boolean;
  language?: 'en' | 'es';
}

const EncounterSpeak = ({ isActive, onError, isSpeakerMode, language = 'en' }: EncounterSpeakProps) => {
  const [spanishText, setSpanishText] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasAudioDevice, setHasAudioDevice] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const deviceCheckTimeoutRef = useRef<number | null>(null);
  const t = translations[language];

  const checkAudioDevices = async (retryCount = 0): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setHasAudioDevice(false);
        onError('Audio input is not supported in your browser.');
        return false;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');

      if (audioDevices.length === 0 && retryCount === 0) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          stream.getTracks().forEach(track => track.stop());
          return checkAudioDevices(retryCount + 1);
        } catch (err: any) {
          console.error('Initial device access error:', err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setHasPermission(false);
            onError('Microphone access was denied. Please allow microphone access in your browser settings.');
            return false;
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setHasAudioDevice(false);
            onError('No microphone found. Please connect a microphone and try again.');
            return false;
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setHasAudioDevice(false);
            onError('Could not start audio source. Is your microphone being used by another application?');
            return false;
          }
          onError('Unable to access microphone. Please check your device settings.');
          return false;
        }
      }
      
      if (audioDevices.length === 0) {
        setHasAudioDevice(false);
        onError('No microphone found. Please connect a microphone and try again.');
        return false;
      }

      setHasAudioDevice(true);
      setHasPermission(true);
      onError(null);
      return true;
    } catch (err) {
      console.error('Device enumeration error:', err);
      setHasAudioDevice(false);
      onError('Unable to detect audio devices. Please check your browser settings.');
      return false;
    }
  };

  const startRecognition = async () => {
    if (!recognitionRef.current || !isActive || isInitializing) return;

    try {
      setIsInitializing(true);
      
      const hasAccess = await checkAudioDevices();
      if (!hasAccess) {
        setIsInitializing(false);
        return;
      }

      recognitionRef.current.start();
    } catch (err) {
      console.error('Start recognition error:', err);
      onError('Failed to start speech recognition. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const stopRecognition = () => {
    if (deviceCheckTimeoutRef.current) {
      window.clearTimeout(deviceCheckTimeoutRef.current);
      deviceCheckTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Stop recognition error:', err);
      }
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const translateToEnglish = async (text: string) => {
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
            q: text,
            source: 'es',
            target: 'en',
            format: 'text'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;
      setEnglishText(translatedText);
      return translatedText;
    } catch (err) {
      console.error('Translation error:', err);
      throw new Error('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const generateSpeech = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      setIsGeneratingSpeech(true);
      
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pqHfZKP75CvOlQylNhV4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': 'sk_fc3cf065a531918b6de89add71bc3cf8633fdcc4c225e29b'
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
      audioRef.current.volume = isSpeakerMode ? 1.0 : 0.3;
      
      audioRef.current.onended = () => {
        URL.revokeObjectURL(url);
      };

      await audioRef.current.play();
    } catch (err) {
      console.error('Speech generation error:', err);
      onError('Failed to generate speech. Please try again.');
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const handleSpeechResult = async (transcript: string, isFinal: boolean) => {
    setSpanishText(transcript);

    if (isFinal && transcript.trim()) {
      try {
        const translatedText = await translateToEnglish(transcript);
        await generateSpeech(translatedText);
      } catch (err) {
        onError('Translation failed. Please try again.');
      }
    }
  };

  useEffect(() => {
    checkAudioDevices();

    const handleDeviceChange = () => {
      if (deviceCheckTimeoutRef.current) {
        window.clearTimeout(deviceCheckTimeoutRef.current);
      }
      deviceCheckTimeoutRef.current = window.setTimeout(() => {
        checkAudioDevices();
      }, 500);
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      stopRecognition();
      if (deviceCheckTimeoutRef.current) {
        window.clearTimeout(deviceCheckTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      stopRecognition();
      setSpanishText('');
      setEnglishText('');
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError('Speech recognition is not supported in your browser.');
      return;
    }

    recognitionRef.current = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'es-ES';

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          handleSpeechResult(finalTranscript.trim(), true);
        } else {
          interimTranscript += transcript;
          handleSpeechResult(interimTranscript, false);
        }
      }
    };

    recognitionRef.current.onerror = async (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        onError('Microphone access was denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'audio-capture') {
        if (deviceCheckTimeoutRef.current) {
          window.clearTimeout(deviceCheckTimeoutRef.current);
        }
        deviceCheckTimeoutRef.current = window.setTimeout(async () => {
          await checkAudioDevices();
        }, 1000);
      } else if (event.error === 'no-speech') {
        return;
      } else if (event.error !== 'aborted') {
        onError('Speech recognition error. Please try again.');
      }
    };

    recognitionRef.current.onend = () => {
      if (isActive && hasPermission && hasAudioDevice) {
        try {
          startRecognition();
        } catch (err) {
          console.error('Restart recognition error:', err);
        }
      }
    };

    startRecognition();

    return () => {
      stopRecognition();
    };
  }, [isActive, hasPermission, hasAudioDevice]);

  return (
    <div className="relative z-10">
      {(spanishText || englishText) ? (
        <>
          <div className="text-gray-400 text-sm mb-2">
            Español:
          </div>
          <p className="text-gray-100 text-lg mb-4">{spanishText || '...'}</p>
          <div className="text-gray-400 text-sm mb-2">
            English:
          </div>
          <p className="text-gray-100 text-lg">
            {isTranslating ? (
              <span className="text-gray-400">Translating...</span>
            ) : (
              englishText || '...'
            )}
          </p>
          {isGeneratingSpeech && (
            <div className="mt-2 text-blue-400 text-sm">
              Generating speech...
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-500 text-center">
          {isActive ? 
            !hasAudioDevice ?
              'No microphone found. Please connect a microphone and try again.' :
            hasPermission === false ? 
              'Please allow microphone access in your browser settings' :
              'Habla en español...' 
            : 'Press the speaker button to start'
          }
        </div>
      )}
    </div>
  );
};

export default EncounterSpeak;