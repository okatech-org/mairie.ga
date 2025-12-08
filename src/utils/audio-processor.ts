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
  private isRecording = false;

  constructor(onAudioData: (base64Audio: string) => void) {
    this.onAudioData = onAudioData;
  }

  async start(): Promise<void> {
    if (this.isRecording) {
      console.log('⚠️ [AudioRecorder] Already recording');
      return;
    }

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

      // Create AudioContext - may need to be resumed after user interaction
      this.audioContext = new AudioContext({
        sampleRate: RECORDING_SAMPLE_RATE,
      });

      // Resume if suspended (browser security feature)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('✅ [AudioRecorder] AudioContext resumed');
      }

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Use larger buffer for stability
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Audio = this.encodeAudioToPCM16Base64(inputData);
        this.onAudioData(base64Audio);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isRecording = true;
      console.log('✅ [AudioRecorder] Recording started at 16kHz');
    } catch (error) {
      console.error('❌ [AudioRecorder] Error accessing microphone:', error);
      throw error;
    }
  }

  stop(): void {
    this.isRecording = false;
    
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) { /* ignore */ }
      this.source = null;
    }
    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (e) { /* ignore */ }
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
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
  private gainNode: GainNode | null = null;

  constructor(onPlaybackStart?: () => void, onPlaybackEnd?: () => void) {
    this.onPlaybackStart = onPlaybackStart;
    this.onPlaybackEnd = onPlaybackEnd;
  }

  async init(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({
        sampleRate: PLAYBACK_SAMPLE_RATE
      });
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      this.gainNode.connect(this.audioContext.destination);
      
      console.log('✅ [AudioPlayer] Initialized at 24kHz');
    }
    
    // Resume if suspended (browser security feature)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('✅ [AudioPlayer] AudioContext resumed');
    }
  }

  /**
   * Add PCM16 base64 audio to queue and play
   */
  async addToQueue(base64Audio: string): Promise<void> {
    if (!this.audioContext) {
      await this.init();
    }

    // Ensure context is running
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      const pcmData = this.decodeBase64ToPCM16(base64Audio);
      
      if (pcmData.length === 0) {
        console.warn('⚠️ [AudioPlayer] Empty audio data received');
        return;
      }
      
      const audioBuffer = this.createAudioBuffer(pcmData);
      this.queue.push(audioBuffer);
      console.log(`📥 [AudioPlayer] Added to queue, length: ${this.queue.length}`);

      if (!this.isPlaying) {
        this.playNext();
      }
    } catch (error) {
      console.error('❌ [AudioPlayer] Error adding audio to queue:', error);
    }
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      console.log('✅ [AudioPlayer] Queue empty, playback ended');
      this.onPlaybackEnd?.();
      return;
    }

    this.isPlaying = true;
    
    // Notify on first buffer
    if (!this.currentSource) {
      this.onPlaybackStart?.();
    }

    const audioBuffer = this.queue.shift()!;

    try {
      if (!this.audioContext || !this.gainNode) {
        console.error('❌ [AudioPlayer] AudioContext not initialized');
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      this.currentSource = source;

      source.onended = () => {
        this.currentSource = null;
        this.playNext();
      };

      source.start(0);
      console.log(`🔊 [AudioPlayer] Playing buffer, duration: ${audioBuffer.duration.toFixed(2)}s`);
    } catch (error) {
      console.error('❌ [AudioPlayer] Error playing audio:', error);
      this.currentSource = null;
      this.playNext(); // Continue with next segment
    }
  }

  /**
   * Set playback volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
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
    console.log('🛑 [AudioPlayer] Playback stopped');
    this.onPlaybackEnd?.();
  }

  /**
   * Decode base64 to Uint8Array
   */
  private decodeBase64ToPCM16(base64: string): Uint8Array {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      console.error('❌ [AudioPlayer] Error decoding base64:', error);
      return new Uint8Array(0);
    }
  }

  /**
   * Create AudioBuffer from PCM16 data
   */
  private createAudioBuffer(pcmData: Uint8Array): AudioBuffer {
    // Convert bytes to 16-bit samples (little endian)
    const sampleCount = Math.floor(pcmData.length / 2);
    const int16Data = new Int16Array(sampleCount);
    
    for (let i = 0; i < sampleCount; i++) {
      const byteIndex = i * 2;
      // Little endian: low byte first, then high byte
      int16Data[i] = (pcmData[byteIndex + 1] << 8) | pcmData[byteIndex];
    }

    // Create audio buffer
    const audioBuffer = this.audioContext!.createBuffer(
      1, // mono
      int16Data.length,
      PLAYBACK_SAMPLE_RATE
    );

    // Convert Int16 to Float32 (-1.0 to 1.0)
    const float32Data = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    return audioBuffer;
  }

  close(): void {
    this.stop();
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) { /* ignore */ }
      this.gainNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    console.log('🛑 [AudioPlayer] Closed');
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

  async start(stream: MediaStream): Promise<void> {
    this.audioContext = new AudioContext();
    
    // Resume if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
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
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }
}
