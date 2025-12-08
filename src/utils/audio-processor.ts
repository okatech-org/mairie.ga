/**
 * Audio Processor for Gemini 2.0 Flash Live API
 * Handles recording at 16kHz and playback at 24kHz
 */

// Audio configuration constants
export const RECORDING_SAMPLE_RATE = 16000; // 16kHz for input (required by Gemini)
export const PLAYBACK_SAMPLE_RATE = 24000;  // 24kHz for output (Gemini's output format)

/**
 * AudioRecorder - Records audio from microphone at 16kHz PCM16
 */
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onAudioData: (audioData: string) => void;

  constructor(onAudioData: (base64Audio: string) => void) {
    this.onAudioData = onAudioData;
  }

  async start(): Promise<void> {
    try {
      console.log('🎙️ [AudioRecorder] Requesting microphone access...');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: RECORDING_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext({
        sampleRate: RECORDING_SAMPLE_RATE,
      });

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Audio = this.encodeAudioToPCM16Base64(inputData);
        this.onAudioData(base64Audio);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      console.log('✅ [AudioRecorder] Recording started at 16kHz');
    } catch (error) {
      console.error('❌ [AudioRecorder] Error accessing microphone:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('🛑 [AudioRecorder] Recording stopped');
  }

  /**
   * Convert Float32Array audio data to PCM16 base64
   */
  private encodeAudioToPCM16Base64(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    return btoa(binary);
  }
}

/**
 * AudioPlayer - Plays PCM16 audio at 24kHz
 * Uses an audio queue for sequential playback
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private queue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private onPlaybackStart?: () => void;
  private onPlaybackEnd?: () => void;

  constructor(onPlaybackStart?: () => void, onPlaybackEnd?: () => void) {
    this.onPlaybackStart = onPlaybackStart;
    this.onPlaybackEnd = onPlaybackEnd;
  }

  async init(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({
        sampleRate: PLAYBACK_SAMPLE_RATE
      });
      console.log('✅ [AudioPlayer] Initialized at 24kHz');
    }
  }

  /**
   * Add PCM16 base64 audio to queue and play
   */
  async addToQueue(base64Audio: string): Promise<void> {
    if (!this.audioContext) {
      await this.init();
    }

    try {
      const pcmData = this.decodeBase64ToPCM16(base64Audio);
      const audioBuffer = await this.createAudioBuffer(pcmData);
      this.queue.push(audioBuffer);

      if (!this.isPlaying) {
        this.playNext();
      }
    } catch (error) {
      console.error('❌ [AudioPlayer] Error adding audio to queue:', error);
    }
  }

  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onPlaybackEnd?.();
      return;
    }

    this.isPlaying = true;
    if (this.queue.length === 1) {
      this.onPlaybackStart?.();
    }

    const audioBuffer = this.queue.shift()!;

    try {
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext!.destination);

      this.currentSource = source;

      source.onended = () => {
        this.currentSource = null;
        this.playNext();
      };

      source.start(0);
    } catch (error) {
      console.error('❌ [AudioPlayer] Error playing audio:', error);
      this.playNext(); // Continue with next segment
    }
  }

  /**
   * Stop playback and clear queue
   */
  stop(): void {
    this.queue = [];
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.onPlaybackEnd?.();
  }

  /**
   * Decode base64 to Uint8Array
   */
  private decodeBase64ToPCM16(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Create AudioBuffer from PCM16 data
   */
  private async createAudioBuffer(pcmData: Uint8Array): Promise<AudioBuffer> {
    // Convert bytes to 16-bit samples (little endian)
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }

    // Create audio buffer
    const audioBuffer = this.audioContext!.createBuffer(
      1, // mono
      int16Data.length,
      PLAYBACK_SAMPLE_RATE
    );

    // Convert Int16 to Float32
    const float32Data = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    return audioBuffer;
  }

  close(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/**
 * Audio level analyzer for visualization
 */
export class AudioLevelAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number | null = null;
  private onLevelChange: (level: number) => void;

  constructor(onLevelChange: (level: number) => void) {
    this.onLevelChange = onLevelChange;
  }

  start(stream: MediaStream): void {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.analyze();
  }

  private analyze = (): void => {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    this.onLevelChange(average / 255);

    this.animationFrame = requestAnimationFrame(this.analyze);
  };

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
  }
}
