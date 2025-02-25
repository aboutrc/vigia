import React, { useState, useEffect, useRef } from 'react';
import { Mic, AlertTriangle, Chrome, Loader2 } from 'lucide-react';
import { translations } from '../translations';
import { translateText, initializeTranslator } from '../lib/translator';

interface EncounterListenProps {
  language?: 'en' | 'es';
}

const EncounterListen = ({ language = 'en' }: EncounterListenProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [englishText, setEnglishText] = useState('');
  const [spanishText, setSpanishText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [isFirefox] = useState(() => navigator.userAgent.toLowerCase().includes('firefox'));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const t = translations[language];

  useEffect(() => {
    if (isFirefox) {
      setError(language === 'es'
        ? 'Firefox móvil no admite el reconocimiento de voz. Por favor, use Chrome o Edge para esta función.'
        : 'Firefox mobile does not support speech recognition. Please use Chrome or Edge for this feature.');
      return;
    }

    // Initialize speech recognition
    if (!recognitionRef.current) {
      if ('webkitSpeechRecognition' in window) {
        recognitionRef.current = new window.webkitSpeechRecognition();
      } else if ('SpeechRecognition' in window) {
        recognitionRef.current = new window.SpeechRecognition();
      } else {
        setError(language === 'es'
          ? 'Su navegador no admite el reconocimiento de voz'
          : 'Your browser does not support speech recognition');
        return;
      }

      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setEnglishText(transcript);
        setIsTranslating(true);
        
        try {
          const translation = await translateText(transcript);
          setSpanishText(translation);
        } catch (err) {
          setError(language === 'es'
            ? 'Error en la traducción. Por favor, intente de nuevo.'
            : 'Translation error. Please try again.');
        } finally {
          setIsTranslating(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        if (event.error === 'service-not-allowed') {
          setError(language === 'es'
            ? 'El servicio de reconocimiento de voz no está disponible. Por favor, verifique los permisos del micrófono.'
            : 'Speech recognition service is not available. Please check microphone permissions.');
        } else {
          setError(language === 'es'
            ? 'Error al procesar el audio. Por favor, intente de nuevo.'
            : 'Error processing audio. Please try again.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
    }

    // Initialize the translator
    initializeTranslator().catch(err => {
      console.error('Failed to initialize translator:', err);
      setError(language === 'es'
        ? 'Error al inicializar el traductor. Por favor, recargue la página.'
        : 'Error initializing translator. Please reload the page.');
    });

    checkMicrophonePermission();

    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isFirefox, language]);

  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionState(permissionStatus.state);
        
        permissionStatus.onchange = () => {
          setPermissionState(permissionStatus.state);
          if (permissionStatus.state === 'granted') {
            setError(null);
          }
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      stream.getTracks().forEach(track => track.stop());
      setError(null);
      setPermissionState('granted');
      return true;
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(language === 'es'
          ? 'Acceso al micrófono denegado. Por favor, cierre y vuelva a abrir la página, luego intente de nuevo.'
          : 'Microphone access denied. Please close and reopen the page, then try again.');
        setPermissionState('denied');
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
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
        setEnglishText('');
        setSpanishText('');
      }
    } catch (err) {
      console.error('Start recording error:', err);
      setError(language === 'es'
        ? 'Error al iniciar la grabación. Por favor, intente de nuevo.'
        : 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 min-h-[200px]">
      <div className="space-y-4">
        {permissionState === 'denied' && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span className="font-medium">
                {language === 'es' ? 'Acceso Denegado' : 'Access Denied'}
              </span>
            </div>
            <p className="text-sm">
              {language === 'es'
                ? 'Por favor, cierre completamente el navegador y vuelva a abrir la página para restablecer los permisos del micrófono.'
                : 'Please completely close your browser and reopen the page to reset microphone permissions.'}
            </p>
          </div>
        )}

        {isFirefox && (
          <div className="bg-blue-900/50 text-blue-100 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Chrome size={20} className="flex-shrink-0" />
              <span className="font-medium">
                {language === 'es' ? 'Navegador Recomendado' : 'Recommended Browser'}
              </span>
            </div>
            <p className="text-sm">
              {language === 'es'
                ? 'Para usar esta función, por favor abra esta página en Chrome o Edge.'
                : 'To use this feature, please open this page in Chrome or Edge.'}
            </p>
          </div>
        )}

        {error && !isFirefox && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm font-medium text-gray-400 mb-2">English:</div>
          <p className="text-gray-100 min-h-[2.5rem]">
            {englishText || (isRecording ? 'Recording...' : 'Click record to start')}
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm font-medium text-gray-400 mb-2">Español:</div>
          <p className="text-gray-100 min-h-[2.5rem]">
            {isTranslating ? (
              <span className="flex items-center gap-2 text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                Traduciendo...
              </span>
            ) : (
              spanishText || (isRecording ? 'Grabando...' : 'Haga clic en grabar para comenzar')
            )}
          </p>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-8 py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : isFirefox
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={isTranslating || isFirefox}
          >
            <Mic size={20} className={isRecording ? 'animate-bounce' : ''} />
            <span className="font-medium">
              {isRecording
                ? language === 'en' ? 'Stop Recording' : 'Detener'
                : language === 'en' ? 'Start Recording' : 'Grabar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EncounterListen;