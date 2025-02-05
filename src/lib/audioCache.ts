import { audioStatements } from './audioStatements';

class AudioCache {
  private cache: Map<string, string> = new Map();
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private retryDelays = [1000, 2000, 4000, 8000]; // Extended retry delays
  private rateLimitDelay = 2000; // Increased delay between requests
  private maxRetries = 3;
  private pendingRequests = new Set<string>();

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(text: string, retryCount = 0): Promise<Response> {
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
        const errorBody = await response.text().catch(() => 'No error details');
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      return response;
    } catch (err) {
      if (retryCount < this.maxRetries) {
        console.log(`Retrying request (${retryCount + 1}/${this.maxRetries})...`);
        await this.delay(this.retryDelays[retryCount]);
        return this.makeRequest(text, retryCount + 1);
      }
      throw err;
    }
  }

  async generateSpeech(text: string): Promise<string> {
    if (this.pendingRequests.has(text)) {
      // Wait for any existing request to complete
      while (this.pendingRequests.has(text)) {
        await this.delay(100);
      }
      if (this.cache.has(text)) {
        return this.cache.get(text)!;
      }
    }

    this.pendingRequests.add(text);

    try {
      const response = await this.makeRequest(text);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      this.cache.set(text, url);
      return url;
    } finally {
      this.pendingRequests.delete(text);
    }
  }

  async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const failedStatements: typeof audioStatements = [];

      try {
        // Process statements in batches of 3
        for (let i = 0; i < audioStatements.length; i += 3) {
          const batch = audioStatements.slice(i, i + 3);
          const results = await Promise.allSettled(
            batch.map(async (statement) => {
              if (!this.cache.has(statement.text)) {
                try {
                  const url = await this.generateSpeech(statement.text);
                  this.cache.set(statement.text, url);
                } catch (err) {
                  console.warn(`Failed to generate speech for: ${statement.title}`, err);
                  failedStatements.push(statement);
                }
              }
            })
          );

          // Add delay between batches
          if (i + 3 < audioStatements.length) {
            await this.delay(this.rateLimitDelay);
          }
        }

        // Retry failed statements once
        if (failedStatements.length > 0) {
          console.log(`Retrying ${failedStatements.length} failed statements...`);
          await this.delay(this.rateLimitDelay * 2);
          
          for (const statement of failedStatements) {
            try {
              if (!this.cache.has(statement.text)) {
                const url = await this.generateSpeech(statement.text);
                this.cache.set(statement.text, url);
              }
              await this.delay(this.rateLimitDelay);
            } catch (err) {
              console.error(`Final attempt failed for: ${statement.title}`, err);
            }
          }
        }

        this.isInitialized = true;
      } catch (err) {
        console.error('Cache initialization error:', err);
        throw err;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async getAudio(text: string): Promise<string> {
    try {
      // If not in cache, generate it
      if (!this.cache.has(text)) {
        const url = await this.generateSpeech(text);
        this.cache.set(text, url);
      }
      return this.cache.get(text)!;
    } catch (err) {
      console.error('Error getting audio:', err);
      throw new Error('Failed to get audio');
    }
  }

  clearCache() {
    // Revoke all object URLs
    this.cache.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.cache.clear();
    this.isInitialized = false;
  }
}

export const audioCache = new AudioCache();