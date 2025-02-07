import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, AlertTriangle, Link as LinkIcon, Copy, Play, Check } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../lib/supabase';
import { audioCache } from '../lib/audioCache';

interface RecordingEntry {
  id: string;
  recording_url: string;
  created_at: string;
  location: string;
  publicUrl?: string;
}

const Registro = ({ language = 'en' }: { language?: 'en' | 'es' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const t = translations[language];

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

  const visualizeAudio = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(average);

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  };

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const previewRecording = async (audioBlob: Blob) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(audioBlob);
    setPreviewUrl(url);

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = url;
    audioRef.current.onended = () => setIsPlaying(false);
  };

  const playPreview = () => {
    if (!audioRef.current || !previewUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const generateAndPlaySpeech = async (text: string) => {
    try {
      if (currentPlaying === text) {
        stopCurrentAudio();
        return;
      }

      stopCurrentAudio();
      setIsGenerating(true);
      setError(null);

      // Try to get from cache first
      let url;
      try {
        url = await audioCache.getAudio(text);
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
        // If cache fails, try direct API call
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
          throw new Error(`API error: ${response.status}`);
        }

        const blob = await response.blob();
        url = URL.createObjectURL(blob);
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      audioRef.current.volume = 1.0; // Reset to normal volume
      
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        throw new Error('Failed to play audio');
      };

      await audioRef.current.play();
      setCurrentPlaying(text);
    } catch (err) {
      console.error('Speech generation error:', err);
      setError('Speech generation failed. Please try again in a few seconds.');
      setCurrentPlaying(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentPlaying(null);
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      // First check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      visualizeAudio(stream);

      console.log('Audio stream obtained');

      // Define supported MIME types in order of preference
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
        'audio/aac',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      if (!selectedMimeType) {
        selectedMimeType = ''; // Let browser choose default
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        ...(selectedMimeType && { mimeType: selectedMimeType }),
        audioBitsPerSecond: 128000
      });
      audioChunksRef.current = [];


      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Received audio chunk:', {
            size: event.data.size,
            type: event.data.type,
            time: new Date().toISOString()
          });
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording error occurred. Please try again.');
        stopRecording();
      };

      mediaRecorderRef.current.start();
      console.log('Recording started');
      
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Recording setup error:', err instanceof Error ? {
        name: err.name,
        message: err.message,
        stack: err.stack
      } : err);
      setError(t.errors.audio.recording);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve, reject) => {
      const recorder = mediaRecorderRef.current!;
      const tracks = recorder.stream.getTracks();

      try {
        console.log('Stopping recording...');
        setIsRecording(false);
        stopVisualization();

        // Handle the stop event
        recorder.onstop = async () => {
          try {
            console.log('Recorder stopped, processing audio...');
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: recorder.mimeType || 'audio/webm' 
            });
            
            console.log('Audio blob created:', {
              size: audioBlob.size,
              type: audioBlob.type
            });

            if (audioBlob.size === 0) {
              throw new Error('No audio data recorded');
            }

            await previewRecording(audioBlob);
            await saveRecording(audioBlob, 'Recording');
            resolve();
          } catch (err) {
            console.error('Error processing recording:', err);
            reject(err);
          }
        };

        // Stop the recorder if it's recording
        if (recorder.state === 'recording') {
          recorder.stop();
        }

        // Stop all tracks
        tracks.forEach(track => track.stop());
      } catch (err) {
        console.error('Stop recording error:', err);
        setError('Failed to stop recording. Please try again.');
        setIsRecording(false);
        tracks.forEach(track => track.stop());
        reject(err);
      }
    });
  };

  const saveRecording = async (audioBlob: Blob, recordingType: string) => {
    try {
      const timestamp = new Date().toISOString();
      // Ensure we have a valid extension
      let extension = 'webm'; // Default to webm
      const mimeType = audioBlob.type.toLowerCase();
      if (mimeType.includes('mp4') || mimeType.includes('aac')) {
        extension = 'mp4';
      } else if (mimeType.includes('ogg')) {
        extension = 'ogg';
      } else if (mimeType.includes('wav')) {
        extension = 'wav';
      }

      const filename = `recording_${timestamp}_${recordingType.toLowerCase().replace(/\s+/g, '_')}.${extension}`;
      
      console.log('Saving recording:', {
        type: audioBlob.type,
        size: audioBlob.size,
        filename,
        extension
      });

      if (audioBlob.size === 0) {
        throw new Error('Empty audio blob');
      }
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filename, audioBlob, {
          contentType: audioBlob.type,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get the public URL immediately after upload
      const { data: urlData } = await supabase.storage
        .from('recordings')
        .getPublicUrl(uploadData.path, {
          download: true,
          transform: {
            quality: 75
          }
        });

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Create database entry
      const { error: dbError } = await supabase
        .from('recordings')
        .insert([
          {
            recording_url: uploadData.path,
            public_url: urlData.publicUrl,
            location: `${recordingType} - ${location || 'Unknown location'}`,
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

  const getRecordingUrl = async (path: string) => {
    try {
      const { data } = await supabase.storage
        .from('recordings')
        .getPublicUrl(path);
      
      if (!data?.publicUrl) {
        throw new Error('Failed to get signed URL');
      }

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

  const presetMessages = [
    {
      title: t.registro.notifyRecording,
      text: "This conversation is being recorded for documentary evidence should I need it."
    },
    {
      title: t.registro.constitutionalRights,
      text: "Under my Fourth, Fifth and Fourteenth amendment rights in the U.S. Constitution, I do not have to answer any of your questions unless you have a signed warrant from a judge that you can present me. Do you have one - yes or no?"
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

  const presetAudioFiles = {
    notifyRecording: '/audio/checkpoint.mp3',
    constitutionalRights: '/audio/rights.mp3',
    emergency: '/audio/emergency.mp3'
  };

  useEffect(() => {
    return () => {
      stopVisualization();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-6">
            {language === 'en' ? 'Officer Encounter' : 'Encuentro con Oficial'}
          </h1>

          <p className="text-gray-300 mb-8">
            Press the record button to start the documentation. Then start pressing each of the buttons and wait for the officer to respond before pressing the next one. After pressing the goodbye button you will have a copy of your interaction stored for you to hear or send to someone.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-900/50 text-red-100 rounded-lg flex items-center">
              <AlertTriangle className="mr-2" size={20} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                {isRecording && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-32">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${(audioLevel / 255) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
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
            </div>
            
            {previewUrl && !isRecording && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={playPreview}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Square size={16} />
                      Stop Preview
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Preview Recording
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="grid gap-4">
              {presetMessages.map((message, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isGenerating) {
                      generateAndPlaySpeech(message.text);
                    }
                  }}
                  disabled={isGenerating}
                  className={`flex items-center justify-between p-4 bg-black/30 backdrop-blur-sm rounded-lg hover:bg-black/40 transition-colors ${
                    isGenerating 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'text-gray-100'
                  }`}
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-100">{message.title}</h3>
                    {isGenerating && currentPlaying === message.text && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-blue-400">
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </div>
                        <span>Generating audio...</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-full transition-colors bg-gray-700 hover:bg-gray-600 text-gray-100">
                    {currentPlaying === message.text ? <Check size={20} /> : <Play size={20} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

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
                      {new Date(recording.created_at).toLocaleString(
                        language === 'es' ? 'es-ES' : 'en-US'
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Location: {recording.location}
                    </div>
                  </div>
                  {recording.publicUrl && (
                    <div className="mt-3 flex flex-col gap-2">
                      <a
                        download={`recording_${new Date(recording.created_at).toISOString()}.${recording.recording_url.endsWith('m4a') ? 'm4a' : 'webm'}`}
                        href={recording.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full"
                      >
                        <LinkIcon size={16} />
                        <span className="text-xs whitespace-nowrap">Download Recording</span>
                      </a>
                      <button
                        onClick={() => copyToClipboard(recording.publicUrl!)}
                        className={`p-2 rounded-lg transition-colors flex items-center justify-center gap-2 w-full ${
                          copiedUrl === recording.publicUrl
                            ? 'bg-green-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title={copiedUrl === recording.publicUrl ? 'Copied!' : 'Copy link'}
                      >
                        <Copy size={16} />
                        <span className="text-xs whitespace-nowrap">
                          {copiedUrl === recording.publicUrl ? 'Copied!' : 'Copy Link'}
                        </span>
                      </button>
                    </div>
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