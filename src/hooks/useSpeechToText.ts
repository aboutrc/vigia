import { useState, useEffect, useRef } from 'react';

interface UseSpeechToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const isStoppingIntentionally = useRef(false);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    if (isInitializedRef.current) return;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    isInitializedRef.current = true;

    const recognition = recognitionRef.current;
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.language ?? 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setError(null);
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          console.log('Final transcript:', finalTranscript.trim());
        } else {
          interimTranscript += transcript;
          console.log('Interim transcript:', interimTranscript);
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = async (event: any) => {
      console.log('Speech recognition error:', event.error);
      
      if (event.error === 'aborted' && isStoppingIntentionally.current) {
        return;
      }
      
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        setError('Microphone access was denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (event.error === 'network') {
        setError('Network error occurred. Please check your connection.');
      } else if (event.error !== 'no-speech') {
        setError('Speech recognition error. Please try again.');
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      // Only auto-restart if we're supposed to be listening and it wasn't intentionally stopped
      if (!isStoppingIntentionally.current && isListening && hasPermission !== false) {
        restartTimeoutRef.current = window.setTimeout(() => {
          try {
            recognition.start();
            console.log('Restarting speech recognition');
          } catch (err) {
            console.error('Restart recognition error:', err);
            setIsListening(false);
          }
        }, 100);
      } else {
        setIsListening(false);
      }
      
      isStoppingIntentionally.current = false;
    };

    return () => {
      isInitializedRef.current = false;
      if (recognition) {
        isStoppingIntentionally.current = true;
        try {
          recognition.stop();
        } catch (err) {
          // Ignore errors when stopping
        }
      }
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [options.continuous, options.interimResults, options.language, isListening, hasPermission]);

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access was denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Unable to access microphone. Please check your device settings.');
      }
      
      return false;
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) return;

    setError(null);
    isStoppingIntentionally.current = false;
    
    const hasAccess = await checkMicrophonePermission();
    if (!hasAccess) return;

    try {
      await recognitionRef.current.start();
      console.log('Started listening');
    } catch (err) {
      console.error('Start recognition error:', err);
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      isStoppingIntentionally.current = true;
      recognitionRef.current.stop();
      console.log('Stopped listening');
    } catch (err) {
      // Ignore errors when stopping
    }
    
    // Clear any restart timeout
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  return {
    isListening,
    transcript,
    error,
    hasPermission,
    startListening,
    stopListening,
    resetTranscript,
  };
}