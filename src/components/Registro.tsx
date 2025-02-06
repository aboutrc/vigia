import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Square, AlertTriangle } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../lib/supabase';

interface RecordingEntry {
  id: string;
  recording_url: string;
  created_at: string;
  location: string;
  publicUrl?: string;
}

const Registro = ({ language = 'en' }: { language?: 'en' | 'es' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const systemAudioBuffersRef = useRef<Array<{ buffer: AudioBuffer; timestamp: number }>>([]);
  const t = translations[language];

  const getCurrentRecordingTime = () => {
    return recordingStartTimeRef.current ? Date.now() - recordingStartTimeRef.current : 0;
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  const blobToAudioBuffer = async (blob: Blob): Promise<AudioBuffer> => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = initAudioContext();
    return await audioContext.decodeAudioData(arrayBuffer);
  };

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

  const getRecordingUrl = async (path: string) => {
    try {
      const { data } = await supabase.storage
        .from('recordings')
        .getPublicUrl(path);
      
      return data.publicUrl;
    } catch (err) {
      console.error('Error getting public URL:', err);
      return null;
    }
  };

  const fetchRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get public URLs for all recordings
      const recordingsWithUrls = await Promise.all(
        (data || []).map(async (recording) => ({
          ...recording,
          publicUrl: await getRecordingUrl(recording.recording_url)
        }))
      );

      setRecordings(recordingsWithUrls);
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError(t.errors.general);
    }
  };

  const startRecording = async () => {
    try {
      systemAudioBuffersRef.current = []; // Reset system audio buffers
      recordingStartTimeRef.current = Date.now();
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

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const microphoneBuffer = await blobToAudioBuffer(audioBlob);
          
          if (systemAudioBuffersRef.current.length > 0 && microphoneBuffer.numberOfChannels > 0) {
            // Merge microphone recording with system audio
            const mergedBuffer = await mergeAudioBuffers([microphoneBuffer]);
            const mergedBlob = await audioBufferToBlob(mergedBuffer);
            await saveRecording(mergedBlob);
          } else {
            // Just save the microphone recording if no system audio
            await saveRecording(audioBlob);
          }
          resolve();
        } catch (err) {
          console.error('Save recording error:', err);
          setError(t.errors.general);
        }
      };
      
      mediaRecorderRef.current!.stop();
      mediaRecorderRef.current!.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    });
  };

  const saveRecording = async (audioBlob: Blob) => {
    try {
      const timestamp = new Date().toISOString();
      const extension = audioBlob.type === 'audio/mpeg' ? 'mp3' : 'webm';
      const filename = `recording_${timestamp}.${extension}`;
      
      console.log('Saving recording:', {
        type: audioBlob.type,
        size: audioBlob.size,
        filename
      });
      
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
            location: audioBlob.type === 'audio/mpeg' ? 'System Generated Audio' : (location || 'Unknown location'),
            created_at: timestamp
          }
        ]);

      if (dbError) throw dbError;

      await fetchRecordings();
    } catch (err) {
      console.error('Save recording error:', err);
      setError(t.errors.general);
      throw err; // Re-throw to handle in the calling function
    }
  };

  const mergeAudioBuffers = async (buffers: AudioBuffer[]): Promise<AudioBuffer> => {
    const audioContext = initAudioContext();
    
    // Ensure we have valid buffers to merge
    if (!buffers.length || !buffers[0]) {
      throw new Error('No valid audio buffers to merge');
    }

    const maxChannels = Math.max(...buffers.map(buffer => buffer.numberOfChannels));
    if (maxChannels === 0) {
      throw new Error('Invalid number of channels in audio buffers');
    }
    
    // Calculate total length based on the last timestamp
    const lastTimestamp = Math.max(
      buffers[0].duration * 1000,
      ...systemAudioBuffersRef.current.map(item => item.timestamp)
    );
    const totalLength = Math.ceil((lastTimestamp / 1000) * audioContext.sampleRate);
    
    const mergedBuffer = audioContext.createBuffer(maxChannels, totalLength, audioContext.sampleRate);

    for (let channel = 0; channel < maxChannels; channel++) {
      const mergedChannelData = mergedBuffer.getChannelData(channel);
      
      // First copy the microphone recording as the base
      if (channel < buffers[0].numberOfChannels) {
        const baseChannelData = buffers[0].getChannelData(channel);
        for (let i = 0; i < baseChannelData.length; i++) {
          mergedChannelData[i] = baseChannelData[i];
        }
      }
      
      // Then mix in each system audio buffer at its correct timestamp
      systemAudioBuffersRef.current.forEach(({ buffer, timestamp }) => {
        if (channel < buffer.numberOfChannels) {
          const startSample = Math.floor((timestamp / 1000) * audioContext.sampleRate);
          const channelData = buffer.getChannelData(channel);
          
          for (let i = 0; i < channelData.length; i++) {
            const targetIndex = startSample + i;
            if (targetIndex < mergedChannelData.length) {
              // Mix the audio instead of replacing
              mergedChannelData[targetIndex] = (mergedChannelData[targetIndex] + channelData[i]) * 0.5;
            }
          }
        }
      });
    }

    return mergedBuffer;
  };

  const audioBufferToBlob = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const audioContext = initAudioContext();
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    const wavBlob = await new Promise<Blob>((resolve) => {
      const length = renderedBuffer.length * 4;
      const view = new DataView(new ArrayBuffer(44 + length));

      // Write WAV header
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, renderedBuffer.numberOfChannels, true);
      view.setUint32(24, renderedBuffer.sampleRate, true);
      view.setUint32(28, renderedBuffer.sampleRate * 4, true);
      view.setUint16(32, 4, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, length, true);

      // Write audio data
      const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
          const s = Math.max(-1, Math.min(1, input[i]));
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
      };

      floatTo16BitPCM(view, 44, renderedBuffer.getChannelData(0));

      resolve(new Blob([view], { type: 'audio/wav' }));
    });

    return wavBlob;
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const generateAndPlaySpeech = async (text: string) => {
    try {
      console.log('Generating speech for:', text);
      const startTime = getCurrentRecordingTime();
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
        const errorData = await response.text();
        console.error('ElevenLabs API error:', errorData);
        throw new Error(`Speech generation failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('Received audio blob:', blob.size, 'bytes', blob.type);
      
      // Create a new blob with explicit audio/mpeg type
      const audioBlob = new Blob([blob], { type: 'audio/mpeg' });

      // If recording is active, store the audio buffer for later merging
      if (isRecording) {
        try {
          const audioBuffer = await blobToAudioBuffer(audioBlob);
          systemAudioBuffersRef.current.push({
            buffer: audioBuffer,
            timestamp: getCurrentRecordingTime()
          });
          console.log('Stored system audio for merging');
        } catch (err) {
          console.error('Failed to store system audio:', err);
        }
      }

      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      
      // Set up audio event handlers
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(url);
        setError(t.errors.audio.play);
      };
      
      audio.oncanplaythrough = async () => {
        try {
          audio.volume = 0.8;
          const playResult = audio.play();
          if (playResult !== undefined) {
            await playResult;
          }
          console.log('Audio playback started');
        } catch (err) {
          console.error('Audio play error:', err);
          setError(t.errors.audio.play);
          URL.revokeObjectURL(url);
        }
      };
      
      audio.onended = () => {
        console.log('Audio playback completed');
        URL.revokeObjectURL(url);
        const duration = (Date.now() - startTime) / 1000;
        console.log(`Total audio processing time: ${duration}s`);
      };
    } catch (err) {
      console.error('Speech generation/playback error:', err);
      if (err instanceof Error) {
        setError(`${t.errors.audio.play}: ${err.message}`);
      } else {
        setError(t.errors.audio.play);
      }
      setError(t.errors.audio.play);
    }
  };

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
                  {recording.publicUrl && (
                    <button
                      onClick={() => {
                        const audio = new Audio(recording.publicUrl);
                        audio.play().catch(err => {
                          console.error('Playback error:', err);
                          setError(t.errors.audio.play);
                        });
                      }}
                      className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <Play size={16} />
                    </button>
                  )}
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