import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Square, Copy, AlertTriangle, Database } from 'lucide-react';
import { translations } from '../translations';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import AudioPlayer from './AudioPlayer';

interface RegistroProps {
  language?: 'en' | 'es';
}

interface Recording {
  id: string;
  recording_url: string;
  created_at: string;
  location: string | null;
  public_url: string;
  session_id: string;
}

const Registro = ({ language = 'en' }: RegistroProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sessionId] = useState(() => uuidv4());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const t = translations[language];

  const checkSupabaseConnection = async () => {
    try {
      setIsCheckingConnection(true);
      const isConnected = await testSupabaseConnection();
      setIsSupabaseConnected(isConnected);
      setError(null);
      
      if (isConnected) {
        await fetchRecordings();
      }
    } catch (err) {
      console.error('Supabase connection error:', err);
      setIsSupabaseConnected(false);
      setError(language === 'es' 
        ? 'Error de conexión a la base de datos. Por favor, conecte a Supabase usando el botón "Connect to Supabase".'
        : 'Database connection error. Please connect to Supabase using the "Connect to Supabase" button.');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  useEffect(() => {
    checkSupabaseConnection();
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.error('Location error:', err);
          setError(language === 'es' 
            ? 'No se pudo obtener la ubicación'
            : 'Could not get location');
        }
      );
    }
  }, []);

  const fetchRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRecordings(data);
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError(language === 'es'
        ? 'Error al cargar las grabaciones'
        : 'Error loading recordings');
    }
  };

  const startRecording = async () => {
    if (!isSupabaseConnected) {
      setError(language === 'es'
        ? 'Por favor, conecte a Supabase primero'
        : 'Please connect to Supabase first');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await saveRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Recording error:', err);
      setError(language === 'es'
        ? 'Error al iniciar la grabación'
        : 'Error starting recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async (audioBlob: Blob) => {
    try {
      const fileName = `${uuidv4()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('recordings')
        .insert({
          recording_url: fileName,
          location: location ? `${location.lat},${location.lng}` : null,
          public_url: publicUrl,
          session_id: sessionId
        });

      if (dbError) throw dbError;

      await fetchRecordings();
    } catch (err) {
      console.error('Save recording error:', err);
      setError(language === 'es'
        ? 'Error al guardar la grabación'
        : 'Error saving recording');
    }
  };

  const copyRecordingLink = async (publicUrl: string) => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.textContent = language === 'es' ? 'Enlace copiado!' : 'Link copied!';
      successMsg.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      setError(language === 'es'
        ? 'Error al copiar el enlace'
        : 'Error copying link');
    }
  };

  if (isCheckingConnection) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-300 animate-pulse">
          {language === 'es' ? 'Verificando conexión...' : 'Checking connection...'}
        </div>
      </div>
    );
  }

  if (!isSupabaseConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-8 max-w-md w-full">
          <div className="flex justify-center mb-6 text-blue-500">
            <Database size={48} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            {language === 'es' ? 'Conexión Requerida' : 'Connection Required'}
          </h2>
          <p className="text-gray-300 text-center mb-6">
            {language === 'es'
              ? 'Por favor, conecte a Supabase usando el botón "Connect to Supabase" en la esquina superior derecha.'
              : 'Please connect to Supabase using the "Connect to Supabase" button in the top right corner.'}
          </p>
          <div className="flex justify-center">
            <button
              onClick={checkSupabaseConnection}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              {language === 'es' ? 'Reintentar Conexión' : 'Retry Connection'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            {language === 'en' ? 'Record Interaction' : 'Grabar Interacción'}
          </h2>

          {error && (
            <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {isRecording ? (
                <>
                  <Square size={20} className="animate-pulse" />
                  <span>{language === 'en' ? 'Stop Recording' : 'Detener Grabación'}</span>
                </>
              ) : (
                <>
                  <Mic size={20} />
                  <span>{language === 'en' ? 'Start Recording' : 'Iniciar Grabación'}</span>
                </>
              )}
            </button>

            {isRecording && (
              <div className="flex justify-center">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-500 animate-soundbar"
                      style={{
                        animationDelay: `${i * 0.15}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            {language === 'en' ? 'Pre-recorded Responses' : 'Respuestas Pregrabadas'}
          </h2>
          <AudioPlayer speakerMode={true} language={language} />
        </div>

        {recordings.length > 0 && (
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              {language === 'en' ? 'Saved Recordings' : 'Grabaciones Guardadas'}
            </h2>
            
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="bg-black/30 backdrop-blur-sm rounded-lg p-4 hover:bg-black/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">
                        {new Date(recording.created_at).toLocaleString(
                          language === 'es' ? 'es-ES' : 'en-US'
                        )}
                      </p>
                      {recording.location && (
                        <p className="text-gray-500 text-xs mt-1">
                          {recording.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <audio
                        src={recording.public_url}
                        controls
                        className="h-8"
                      />
                      <button
                        onClick={() => copyRecordingLink(recording.public_url)}
                        className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                        title={language === 'en' ? 'Copy Link' : 'Copiar Enlace'}
                      >
                        <Copy size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registro;