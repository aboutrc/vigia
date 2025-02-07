import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, AlertTriangle, Link as LinkIcon, Copy, Volume2 } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../lib/supabase';
import { audioStatements } from '../lib/audioStatements';

interface RecordingEntry {
  id: string;
  recording_url: string;
  created_at: string;
  location: string;
  public_url: string;
}

const Registro = ({ language = 'en' }: { language?: 'en' | 'es' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Audio Context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  const t = translations[language];

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,  // Disable echo cancellation
          noiseSuppression: false,  // Disable noise suppression
          autoGainControl: false,   // Disable automatic gain control
          channelCount: 1,          // Mono recording
          sampleRate: 44100         // Standard sample rate
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

  useEffect(() => {
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

    fetchRecordings();
    checkMicrophonePermission();

    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const hasAccess = await checkMicrophonePermission();
      if (!hasAccess) return;

      // Request microphone access with specific high-quality settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,      // Disable echo cancellation
          noiseSuppression: false,      // Disable noise suppression
          autoGainControl: false,       // Disable automatic gain control
          channelCount: 1,              // Mono recording
          sampleRate: 48000,            // Higher sample rate
          latency: 0,                   // Minimize latency
          sampleSize: 24                // Higher bit depth
        }
      });

      // Create Audio Context with higher sample rate
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 48000,              // Match input sample rate
        latencyHint: 'interactive'
      });

      // Create source node
      const sourceNode = audioContext.createMediaStreamSource(stream);
      
      // Create processor node with larger buffer for better quality
      const processorNode = audioContext.createScriptProcessor(8192, 1, 1);
      
      // Connect nodes
      sourceNode.connect(processorNode);
      processorNode.connect(audioContext.destination);

      // Handle audio processing with gain boost
      processorNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Apply gain boost to capture quieter sounds
        const boostedData = new Float32Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Boost the signal (1.5x gain) while preventing clipping
          boostedData[i] = Math.max(-1, Math.min(1, inputData[i] * 1.5));
        }
        audioChunksRef.current.push(boostedData);
      };

      // Store refs
      audioContextRef.current = audioContext;
      streamRef.current = stream;
      sourceNodeRef.current = sourceNode;
      processorRef.current = processorNode;
      audioChunksRef.current = [];

      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Recording setup error:', err);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      // Stop recording
      if (processorRef.current) {
        processorRef.current.disconnect();
        sourceNodeRef.current?.disconnect();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }

      // Convert audio data to WAV
      if (audioChunksRef.current.length > 0) {
        const audioData = concatenateAudioBuffers(audioChunksRef.current);
        const wavBlob = createWavBlob(audioData);
        await saveRecording(wavBlob);
      }

      // Clear refs
      audioContextRef.current = null;
      streamRef.current = null;
      sourceNodeRef.current = null;
      processorRef.current = null;
      audioChunksRef.current = [];

      setIsRecording(false);
    } catch (err) {
      console.error('Stop recording error:', err);
      setError('Failed to stop recording. Please try again.');
    }
  };

  const concatenateAudioBuffers = (buffers: Float32Array[]): Float32Array => {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    
    for (const buffer of buffers) {
      result.set(buffer, offset);
      offset += buffer.length;
    }
    
    return result;
  };

  const createWavBlob = (audioData: Float32Array): Blob => {
    const numChannels = 1;
    const sampleRate = 44100;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');                     // ChunkID
    view.setUint32(4, 36 + dataSize, true);     // ChunkSize
    writeString(8, 'WAVE');                     // Format
    writeString(12, 'fmt ');                    // Subchunk1ID
    view.setUint32(16, 16, true);               // Subchunk1Size
    view.setUint16(20, 1, true);                // AudioFormat (PCM)
    view.setUint16(22, numChannels, true);      // NumChannels
    view.setUint32(24, sampleRate, true);       // SampleRate
    view.setUint32(28, byteRate, true);         // ByteRate
    view.setUint16(32, blockAlign, true);       // BlockAlign
    view.setUint16(34, bitsPerSample, true);    // BitsPerSample
    writeString(36, 'data');                    // Subchunk2ID
    view.setUint32(40, dataSize, true);         // Subchunk2Size

    // Write audio data
    const offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset + i * 2, value, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const saveRecording = async (audioBlob: Blob) => {
    try {
      if (audioBlob.size === 0) {
        throw new Error('Audio recording is empty');
      }

      const timestamp = new Date().toISOString();
      const filename = `recording_${timestamp}.wav`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filename, audioBlob, {
          contentType: 'audio/wav',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from('recordings')
        .getPublicUrl(uploadData.path);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      const { error: dbError } = await supabase
        .from('recordings')
        .insert([
          {
            recording_url: uploadData.path,
            public_url: urlData.publicUrl,
            location: location || 'Unknown location',
            created_at: timestamp
          }
        ]);

      if (dbError) throw dbError;

      await fetchRecordings();
    } catch (err) {
      console.error('Save recording error:', err);
      setError('Failed to save recording. Please try again.');
    }
  };

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
      setError('Failed to load recordings');
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setError('Failed to copy URL to clipboard');
    }
  };

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
      
      const makeRequest = async (retryCount: number): Promise<Response> => {
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

          return response;
        } catch (err) {
          if (retryCount < maxRetries) {
            console.log(`Retry attempt ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return makeRequest(retryCount + 1);
          }
          throw err;
        }
      };

      const response = await makeRequest(0);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      audioRef.current.volume = 1.0; // Set to full volume for better recording
      
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
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Recording Section */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-6">
            {language === 'en' ? 'Officer Encounter' : 'Encuentro con Oficial'}
          </h1>

          <p className="text-gray-300 mb-8">
            Press the record button to start documenting your interaction. The recording will be saved automatically when you stop.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-900/50 text-red-100 rounded-lg flex items-center">
              <AlertTriangle className="mr-2" size={20} />
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-4 rounded-full ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
              disabled={hasPermission === false}
            >
              {isRecording ? <Square size={24} /> : <Mic size={24} />}
            </button>
          </div>
        </div>

        {/* Quick Response Buttons */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
            <Volume2 className="mr-2" />
            Quick Responses
          </h2>
          
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
                      {isPlaying ? <Square size={20} /> : <Volume2 size={20} />}
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

        {/* Saved Recordings Section */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Saved Recordings
          </h2>
          
          <div className="space-y-4">
            {recordings.map((recording) => (
              <div 
                key={recording.id}
                className="p-4 bg-gray-800 rounded-lg text-gray-100"
              >
                <div className="flex flex-col">
                  <div>
                    <div className="text-sm text-gray-400">
                      Date & Time: {new Date(recording.created_at).toLocaleString(
                        language === 'es' ? 'es-ES' : 'en-US'
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Location: {recording.location}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <a
                      href={recording.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full"
                    >
                      <LinkIcon size={16} />
                      <span className="text-xs whitespace-nowrap">Download Recording</span>
                    </a>
                    <button
                      onClick={() => copyToClipboard(recording.public_url)}
                      className={`p-2 rounded-lg transition-colors flex items-center justify-center gap-2 w-full ${
                        copiedUrl === recording.public_url
                          ? 'bg-green-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <Copy size={16} />
                      <span className="text-xs whitespace-nowrap">
                        {copiedUrl === recording.public_url ? 'Copied!' : 'Copy Link'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {recordings.length === 0 && (
              <div className="text-center text-gray-400">
                No recordings yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;