import { audioStatements } from './audioStatements';

class AudioCache {
  private cache: Map<string, string> = new Map();
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private retryDelays = [2000, 4000, 8000];
  private rateLimitDelay = 2000;
  private maxRetries = 3;
  private pendingRequests = new Set<string>();
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (err) {
          console.error('Error processing queued request:', err);
        }
        await this.delay(this.rateLimitDelay);
      }
    }

    this.isProcessingQueue = false;
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await this.delay(this.rateLimitDelay - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();
  }

  private async makeRequest(text: string, retryCount = 0): Promise<Response> {
    try {
      await this.waitForRateLimit();

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
        const errorBody = await response.text().catch(() => 'Rate limit exceeded');
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      return response;
    } catch (error) {
      console.error(`Request failed (attempt ${retryCount + 1}/${this.maxRetries}):`, error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error - check connection');
        throw new Error('Network error - please check your connection');
      }

      if (retryCount < this.maxRetries) {
        console.log(`Waiting ${this.retryDelays[retryCount]}ms before retry...`);
        await this.delay(this.retryDelays[retryCount]);
        return this.makeRequest(text, retryCount + 1);
      }
      throw error;
    }
  }

  async generateSpeech(text: string): Promise<string> {
    if (this.pendingRequests.has(text)) {
      console.log('Request already pending, waiting...');
      while (this.pendingRequests.has(text)) {
        await this.delay(100);
      }
      if (this.cache.has(text)) {
        return this.cache.get(text)!;
      }
    }

    this.pendingRequests.add(text);

    try {
      return new Promise((resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const response = await this.makeRequest(text);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            this.cache.set(text, url);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        });
        this.processQueue();
      });
    } finally {
      this.pendingRequests.delete(text);
    }
  }

  async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    await this.delay(5000);
    
    console.log('Initializing audio cache...');
    this.initPromise = (async () => {
      try {
        const failedStatements: typeof audioStatements = [];

        for (const statement of audioStatements) {
          if (!this.cache.has(statement.text)) {
            try {
              console.log(`Generating speech for: ${statement.title}`);
              const url = await this.generateSpeech(statement.text);
              this.cache.set(statement.text, url);
              await this.delay(this.rateLimitDelay * 2);
            } catch (err) {
              console.warn(`Failed to generate speech for: ${statement.title}`, err);
              failedStatements.push(statement);
              await this.delay(this.rateLimitDelay * 4);
            }
          }
        }

        if (failedStatements.length > 0) {
          console.log(`Retrying ${failedStatements.length} failed statements...`);
          await this.delay(this.rateLimitDelay * 8);
          
          for (const statement of failedStatements) {
            try {
              if (!this.cache.has(statement.text)) {
                console.log(`Retrying speech generation for: ${statement.title}`);
                const url = await this.generateSpeech(statement.text);
                this.cache.set(statement.text, url);
                await this.delay(this.rateLimitDelay * 4);
              }
            } catch (err) {
              console.error(`Final attempt failed for: ${statement.title}`, err);
            }
          }
        }

        this.isInitialized = true;
        console.log('Audio cache initialization complete');
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
      console.log('Getting audio for text:', text.substring(0, 50) + '...');
      if (!this.cache.has(text)) {
        console.log('Audio not in cache, generating...');
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
    console.log('Clearing audio cache');
    this.cache.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.cache.clear();
    this.isInitialized = false;
  }
}

export const audioCache = new AudioCache();