import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Square, Save, AlertTriangle } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../lib/supabase';

interface RecordingEntry {
  id: string;
  recording_url: string;
  created_at: string;
  location: string;
}

const Registro = ({ language = 'en' }: { language?: 'en' | 'es' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const t = translations[language];

  const presetMessages = [
    {
      title: t.registro.notifyRecording,
      text: "This conversation is being recorded for documentary evidence should I need it."
    },
    {
      title: t.registro.constitutionalRights,
      text: "Under my rights in the U.S. Constitution- the fourth, fifth, and fourteenth - I do not have to answer any of your questions unless you have a signed warrant from a judge that you can present me. Do you have one - yes or no?"
    },
    {
      title: t.registro.badgeNumber,
      text: "What is your Badge number?"
    },
    {
      title: t.registro.freeToGo,
      text: "Am I free to go? Yes or no."
    },
    {
      title: t.registro.goodbye,
      text: "Thank you. I have documented this for my records. Have a good day officer."
    }
  ];

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude},${position.coords.longitude}`);
        },
        (err) => {
          console.error('Location error:', err);
          setLocation('Location unavailable');
        }
      );
    }

    // Fetch existing recordings
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError(t.errors.general);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Recording error:', err);
      setError(t.errors.audio.recording);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<Blob>((resolve) => {
      mediaRecorderRef.current!.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        resolve(audioBlob);
      };
      mediaRecorderRef.current!.stop();
      mediaRecorderRef.current!.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    });
  };

  const generateAndPlaySpeech = async (text: string) => {
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

      if (!response.ok) throw new Error('Speech generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    } catch (err) {
      console.error('Speech generation error:', err);
      setError(t.errors.audio.play);
    }
  };

  const saveRecording = async (audioBlob: Blob) => {
    try {
      const timestamp = new Date().toISOString();
      const filename = `recording_${timestamp}.webm`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filename, audioBlob);

      if (uploadError) throw uploadError;

      // Create database entry
      const { error: dbError } = await supabase
        .from('recordings')
        .insert([
          {
            recording_url: uploadData.path,
            location: location || 'Unknown location',
            created_at: timestamp
          }
        ]);

      if (dbError) throw dbError;

      await fetchRecordings();
    } catch (err) {
      console.error('Save recording error:', err);
      setError(t.errors.general);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-6">
            {language === 'en' ? 'Proof' : 'Registro'}
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-900/50 text-red-100 rounded-lg flex items-center">
              <AlertTriangle className="mr-2" size={20} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-4 rounded-full ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {isRecording ? <Square size={24} /> : <Mic size={24} />}
              </button>
            </div>

            <div className="grid gap-4">
              {presetMessages.map((message, index) => (
                <button
                  key={index}
                  onClick={() => generateAndPlaySpeech(message.text)}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-gray-100"
                >
                  <span>{message.title}</span>
                  <Play size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            {t.registro.recordings}
          </h2>
          
          <div className="space-y-4">
            {recordings.map((recording) => (
              <div 
                key={recording.id}
                className="p-4 bg-gray-800 rounded-lg text-gray-100"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400">
                      {new Date(recording.created_at).toLocaleString(
                        language === 'es' ? 'es-ES' : 'en-US'
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {recording.location}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const audio = new Audio(recording.recording_url);
                      audio.play();
                    }}
                    className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Play size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;