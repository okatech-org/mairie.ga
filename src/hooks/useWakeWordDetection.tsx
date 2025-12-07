import { useState, useEffect, useRef, useCallback } from 'react';

export interface WakeWordConfig {
    wakeWords: string[];
    enabled: boolean;
    sensitivity?: number; // 0-1, how strict the match should be
}

export interface UseWakeWordDetection {
    isListening: boolean;
    isSupported: boolean;
    detected: boolean;
    lastTranscript: string;
    start: () => void;
    stop: () => void;
    resetDetection: () => void;
}

const DEFAULT_WAKE_WORDS = ['iasted', 'i asted', 'hey asted', 'hé asted', 'assistant', 'assisté'];

// Type for SpeechRecognition since it's not in all TypeScript versions
type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any;

export const useWakeWordDetection = (
    config: WakeWordConfig = { wakeWords: DEFAULT_WAKE_WORDS, enabled: true, sensitivity: 0.6 },
    onWakeWordDetected?: () => void
): UseWakeWordDetection => {
    const [isListening, setIsListening] = useState(false);
    const [detected, setDetected] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    
    const recognitionRef = useRef<any>(null);
    const isSupported = typeof window !== 'undefined' && 
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Normalize text for comparison
    const normalizeText = useCallback((text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s]/g, '') // Remove special chars
            .trim();
    }, []);

    // Check if transcript contains wake word
    const checkWakeWord = useCallback((transcript: string): boolean => {
        const normalized = normalizeText(transcript);
        const words = config.wakeWords || DEFAULT_WAKE_WORDS;
        
        return words.some(word => {
            const normalizedWord = normalizeText(word);
            // Check exact match or fuzzy match
            if (normalized.includes(normalizedWord)) {
                return true;
            }
            // Fuzzy matching for similar sounds
            const similarity = calculateSimilarity(normalized, normalizedWord);
            return similarity >= (config.sensitivity || 0.6);
        });
    }, [config.wakeWords, config.sensitivity, normalizeText]);

    // Simple Levenshtein-based similarity
    const calculateSimilarity = (str1: string, str2: string): number => {
        const words1 = str1.split(' ');
        
        for (const word of words1) {
            if (word.length < 3) continue;
            
            // Check if any word is similar enough
            const distance = levenshteinDistance(word, str2);
            const maxLen = Math.max(word.length, str2.length);
            const similarity = 1 - (distance / maxLen);
            
            if (similarity >= 0.7) return similarity;
        }
        
        return 0;
    };

    const levenshteinDistance = (a: string, b: string): number => {
        const matrix: number[][] = [];
        
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    };

    const start = useCallback(() => {
        if (!isSupported || !config.enabled) return;
        
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionClass) return;
        
        const recognition = new SpeechRecognitionClass();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';
        
        recognition.onstart = () => {
            console.log('🎧 Wake word detection started');
            setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            
            setLastTranscript(transcript);
            
            if (checkWakeWord(transcript)) {
                console.log('🎯 Wake word detected:', transcript);
                setDetected(true);
                onWakeWordDetected?.();
                
                // Auto-reset after detection
                setTimeout(() => setDetected(false), 3000);
            }
        };
        
        recognition.onerror = (event: any) => {
            console.error('❌ Wake word recognition error:', event.error);
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                // Try to restart on recoverable errors
                setTimeout(() => {
                    if (isListening) {
                        recognition.start();
                    }
                }, 1000);
            }
        };
        
        recognition.onend = () => {
            // Auto-restart if we should still be listening
            if (isListening && config.enabled) {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Wake word restart failed, will retry');
                }
            } else {
                setIsListening(false);
            }
        };
        
        try {
            recognition.start();
            recognitionRef.current = recognition;
        } catch (e) {
            console.error('Failed to start wake word detection:', e);
        }
    }, [isSupported, config.enabled, checkWakeWord, onWakeWordDetected, isListening]);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            setIsListening(false);
            recognitionRef.current.stop();
            recognitionRef.current = null;
            console.log('🎧 Wake word detection stopped');
        }
    }, []);

    const resetDetection = useCallback(() => {
        setDetected(false);
        setLastTranscript('');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    return {
        isListening,
        isSupported,
        detected,
        lastTranscript,
        start,
        stop,
        resetDetection
    };
};
