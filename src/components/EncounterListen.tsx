import React, { useState, useRef, useEffect } from 'react';
import { translations } from '../translations';
import { Mic } from 'lucide-react';

interface EncounterListenProps {
  onError: (error: string | null) => void;
  onPermissionPrompt: (show: boolean) => void;
  language?: 'en' | 'es';
}

const EncounterListen = ({ onError, onPermissionPrompt, language = 'en' }: EncounterListenProps) => {
  const [englishText, setEnglishText] = useState('');
  const [spanishText, setSpanishText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasAudioDevice, setHasAudioDevice] = useState<boolean | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const deviceCheckTimeoutRef = useRef<number | null>(null);
  const t = translations[language];

  const translateText = async (text: string) => {
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
            source: 'en',
            target: 'es',
            format: 'text'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;
      setSpanishText(translatedText);
    } catch (err) {
      console.error('Translation error:', err);
      throw new Error('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranscript = async (transcript: string, isFinal: boolean) => {
    setEnglishText(transcript);
    if (isFinal && transcript.trim()) {
      try {
        await translateText(transcript.trim());
      } catch (err) {
        onError('Translation failed. Please try again.');
      }
    }
  };

  const stopRecognition = () => {
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (deviceCheckTimeoutRef.current) {
      window.clearTimeout(deviceCheckTimeoutRef.current);
      deviceCheckTimeoutRef.current = null;
    }

    if (recognitionRef.current && isRecognitionActive) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Stop recognition error:', err);
      } finally {
        setIsRecognitionActive(false);
      }
    }
  };

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
        onPermissionPrompt(true);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          stream.getTracks().forEach(track => track.stop());
          onPermissionPrompt(false);
          return checkAudioDevices(retryCount + 1);
        } catch (err: any) {
          onPermissionPrompt(false);
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
    if (!recognitionRef.current || isInitializing || isRecognitionActive) return;

    try {
      setIsInitializing(true);
      
      const hasAccess = await checkAudioDevices();
      if (!hasAccess) {
        setIsInitializing(false);
        return;
      }

      recognitionRef.current.start();
      setIsRecognitionActive(true);
    } catch (err) {
      console.error('Start recognition error:', err);
      onError('Failed to start speech recognition. Please try again.');
      setIsRecognitionActive(false);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
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
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError('Speech recognition is not supported in your browser.');
      return;
    }

    recognitionRef.current = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          handleTranscript(finalTranscript.trim(), true);
        } else {
          interimTranscript += transcript;
          handleTranscript(interimTranscript, false);
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
      
      setIsRecognitionActive(false);
      setIsInitializing(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecognitionActive(false);
      setIsInitializing(false);

      if (hasPermission && hasAudioDevice && !restartTimeoutRef.current) {
        restartTimeoutRef.current = window.setTimeout(() => {
          restartTimeoutRef.current = null;
          if (hasPermission && hasAudioDevice) {
            startRecognition();
          }
        }, 300);
      }
    };

    return () => {
      stopRecognition();
    };
  }, [hasPermission, hasAudioDevice]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (isRecognitionActive) {
              stopRecognition();
            } else {
              startRecognition();
            }
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isRecognitionActive
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
          disabled={isInitializing}
        >
          <Mic size={20} className={isRecognitionActive ? 'animate-pulse' : ''} />
          <span>
            {isInitializing ? 'Initializing...' :
             isRecognitionActive ? 'Stop Listening' : 'Start Listening'}
          </span>
        </button>
      </div>

      <div className="space-y-4">
        {(englishText || spanishText) ? (
          <>
            <div>
              <div className="text-gray-400 text-sm mb-2">
                English:
              </div>
              <p className="text-gray-100 text-lg mb-4">{englishText || '...'}</p>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-2">
                Español:
              </div>
              <p className="text-gray-100 text-lg">
                {isTranslating ? (
                  <span className="text-gray-400">Traduciendo...</span>
                ) : (
                  spanishText || '...'
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-center">
            {!hasAudioDevice ?
              'No microphone found. Please connect a microphone and try again.' :
            hasPermission === false ? 
              'Please allow microphone access in your browser settings' :
              'Click the microphone button and speak in English...'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default EncounterListen;