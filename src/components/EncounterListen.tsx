import React, { useState, useEffect } from 'react';
import { Mic, AlertTriangle } from 'lucide-react';
import { translations } from '../translations';

interface EncounterListenProps {
  language?: 'en' | 'es';
}

const EncounterListen = ({ language = 'en' }: EncounterListenProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [englishText, setEnglishText] = useState('');
  const [spanishText, setSpanishText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const recognitionRef = useRef<any>(null);

  const t = translations[language];

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(permissionStatus => {
          setPermissionState(permissionStatus.state);
          
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
            if (permissionStatus.state === 'granted') {
              setError(null);
            }
          };
        })
        .catch(err => {
          console.error('Permission query error:', err);
        });
    }
  }, []);

  const translateText = async (text: string) => {
    try {
      setIsProcessing(true);
      
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
      setSpanishText(data.data.translations[0].translatedText);
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(language === 'es' 
          ? 'Acceso al micrófono denegado. Por favor, permita el acceso al micrófono en la configuración de su navegador.'
          : 'Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError(language === 'es'
          ? 'No se encontró micrófono. Por favor, conecte un micrófono e intente de nuevo.'
          : 'No microphone found. Please connect a microphone and try again.');
      } else {
        setError(language === 'es'
          ? 'No se puede acceder al micrófono. Por favor, verifique la configuración de su dispositivo.'
          : 'Unable to access microphone. Please check your device settings.');
      }
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;

      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition is not supported in your browser');
      }

      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            setEnglishText(finalTranscript.trim());
            await translateText(finalTranscript.trim());
          } else {
            interimTranscript += transcript;
            setEnglishText(interimTranscript);
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          setError(language === 'es'
            ? 'Acceso al micrófono denegado. Por favor, permita el acceso al micrófono en la configuración de su navegador.'
            : 'Microphone access was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'audio-capture') {
          setError(language === 'es'
            ? 'No se encontró micrófono. Por favor, conecte un micrófono e intente de nuevo.'
            : 'No microphone found. Please connect a microphone and try again.');
        } else if (event.error === 'network') {
          setError(language === 'es'
            ? 'Error de red. Por favor, verifique su conexión.'
            : 'Network error occurred. Please check your connection.');
        } else if (event.error !== 'no-speech') {
          setError(language === 'es'
            ? 'Error de reconocimiento de voz. Por favor, intente de nuevo.'
            : 'Speech recognition error. Please try again.');
        }
        
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error('Restart recognition error:', err);
            setIsRecording(false);
          }
        }
      };

      await recognitionRef.current.start();
      setIsRecording(true);
      setError(null);
      setEnglishText('');
      setSpanishText('');
    } catch (err) {
      console.error('Recording setup error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Speech recognition')) {
          setError(language === 'es'
            ? 'El reconocimiento de voz no está soportado en su navegador. Por favor, use Chrome o Edge.'
            : 'Speech recognition is not supported in your browser. Please try using Chrome or Edge.');
        } else {
          setError(language === 'es'
            ? 'Error al iniciar la grabación. Por favor, verifique los permisos del micrófono.'
            : 'Failed to start recording. Please check microphone permissions.');
        }
      } else {
        setError(language === 'es'
          ? 'Ocurrió un error desconocido. Por favor, intente de nuevo.'
          : 'An unknown error occurred. Please try again.');
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 min-h-[200px]">
      <div className="space-y-4">
        {permissionState === 'denied' && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>
              {language === 'es'
                ? 'El acceso al micrófono está bloqueado. Por favor, haga clic en el icono del candado en la barra de direcciones y permita el acceso al micrófono.'
                : 'Microphone access is blocked. Please click the lock icon in the address bar and allow microphone access.'}
            </span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm font-medium text-gray-400 mb-2">English:</div>
          <p className="text-gray-100 min-h-[2.5rem]">
            {englishText || (isRecording ? 'Listening...' : 'Click record to start')}
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm font-medium text-gray-400 mb-2">Español:</div>
          <p className="text-gray-100 min-h-[2.5rem]">
            {spanishText || (isRecording ? 'Escuchando...' : 'Haga clic en grabar para comenzar')}
          </p>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-8 py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={isProcessing}
          >
            <Mic size={20} className={isRecording ? 'animate-bounce' : ''} />
            <span className="font-medium">
              {isRecording
                ? language === 'en' ? 'Stop Recording' : 'Detener'
                : language === 'en' ? 'Start Recording' : 'Grabar'}
            </span>
          </button>
        </div>

        {isProcessing && (
          <div className="text-center mt-4">
            <div className="bg-blue-900/90 text-blue-100 px-3 py-1 rounded-full text-sm animate-pulse inline-block">
              Processing...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EncounterListen;