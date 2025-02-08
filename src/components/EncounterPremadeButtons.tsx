// Add this function at the top of the component
const ensureEnglishText = (text: string, isCustom: boolean) => {
  // If it's a custom message, we need to translate it to English before sending to ElevenLabs
  if (isCustom) {
    return translateToEnglish(text);
  }
  // For predefined messages, they are already in English
  return Promise.resolve(text);
};

// Modify the generateAndPlaySpeech function
const generateAndPlaySpeech = async (text: string, isCustom = false) => {
  try {
    if (!text.trim()) return;

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

    // Ensure text is in English before sending to ElevenLabs
    const audioText = await ensureEnglishText(text, isCustom);
    if (isCustom) {
      setTranslatedMessage(audioText);
    }

    // Initialize audio context when needed
    initializeAudioContext();

    const audioUrl = await audioCache.getAudio(audioText);

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    audioRef.current.src = audioUrl;
    audioRef.current.volume = isSpeakerMode ? 1.0 : 0.3;

    if (audioContextRef.current && audioRef.current) {
      // Disconnect any existing source
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }

      // Create and connect new source
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceNodeRef.current.connect(audioContextRef.current.destination);
    }
    
    audioRef.current.onended = () => {
      setCurrentPlaying(null);
    };

    await audioRef.current.play();
    setCurrentPlaying(text);
  } catch (err) {
    console.error('Speech playback error:', err);
    setError('Failed to play speech. Please try again.');
    setCurrentPlaying(null);
  } finally {
    setIsGenerating(false);
  }
};