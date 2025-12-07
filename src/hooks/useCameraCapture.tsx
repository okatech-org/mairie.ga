/**
 * Camera Capture Hook
 * Provides camera access for document scanning on mobile devices
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraCaptureOptions {
    facingMode?: 'user' | 'environment';
    width?: number;
    height?: number;
}

interface UseCameraCaptureReturn {
    videoRef: React.RefObject<HTMLVideoElement>;
    isActive: boolean;
    isLoading: boolean;
    error: string | null;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    switchCamera: () => Promise<void>;
    capturePhoto: () => Promise<Blob | null>;
    currentFacingMode: 'user' | 'environment';
    hasMultipleCameras: boolean;
}

export function useCameraCapture(options: UseCameraCaptureOptions = {}): UseCameraCaptureReturn {
    const {
        facingMode: initialFacingMode = 'environment',
        width = 1920,
        height = 1080
    } = options;

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

    // Check for multiple cameras
    useEffect(() => {
        async function checkCameras() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                setHasMultipleCameras(videoDevices.length > 1);
            } catch (err) {
                console.warn('[CameraCapture] Could not enumerate devices:', err);
            }
        }
        checkCameras();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Stop any existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: width },
                    height: { ideal: height }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setIsActive(true);
        } catch (err: any) {
            console.error('[CameraCapture] Error starting camera:', err);

            let errorMessage = 'Impossible d\'accéder à la caméra';
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'Aucune caméra détectée sur cet appareil.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'La caméra est utilisée par une autre application.';
            }

            setError(errorMessage);
            setIsActive(false);
        } finally {
            setIsLoading(false);
        }
    }, [currentFacingMode, width, height]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsActive(false);
    }, []);

    const switchCamera = useCallback(async () => {
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        setCurrentFacingMode(newFacingMode);

        if (isActive) {
            // Restart with new facing mode
            await startCamera();
        }
    }, [currentFacingMode, isActive, startCamera]);

    const capturePhoto = useCallback(async (): Promise<Blob | null> => {
        if (!videoRef.current || !isActive) {
            return null;
        }

        const video = videoRef.current;

        // Create canvas if not exists
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }

        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => resolve(blob),
                'image/jpeg',
                0.92 // High quality
            );
        });
    }, [isActive]);

    return {
        videoRef,
        isActive,
        isLoading,
        error,
        startCamera,
        stopCamera,
        switchCamera,
        capturePhoto,
        currentFacingMode,
        hasMultipleCameras
    };
}

/**
 * Component for camera preview with capture
 */
import React from 'react';

interface CameraPreviewProps {
    onCapture: (photo: Blob) => void;
    onClose: () => void;
    className?: string;
}

export function CameraPreview({ onCapture, onClose, className }: CameraPreviewProps) {
    const camera = useCameraCapture();

    useEffect(() => {
        camera.startCamera();
        return () => camera.stopCamera();
    }, []);

    const handleCapture = async () => {
        const photo = await camera.capturePhoto();
        if (photo) {
            onCapture(photo);
        }
    };

    if (camera.error) {
        return (
            <div className={`flex flex-col items-center justify-center p-8 bg-destructive/10 rounded-lg ${className}`}>
                <p className="text-destructive text-center mb-4">{camera.error}</p>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                >
                    Fermer
                </button>
            </div>
        );
    }

    return (
        <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
            {camera.isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            )}

            <video
                ref={camera.videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
            />

            {/* Capture controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4 bg-gradient-to-t from-black/60">
                <button
                    onClick={onClose}
                    className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
                >
                    ✕
                </button>

                <button
                    onClick={handleCapture}
                    disabled={!camera.isActive}
                    className="p-4 bg-white rounded-full hover:bg-gray-200 transition disabled:opacity-50"
                >
                    <div className="w-12 h-12 border-4 border-primary rounded-full" />
                </button>

                {camera.hasMultipleCameras && (
                    <button
                        onClick={camera.switchCamera}
                        className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
                    >
                        🔄
                    </button>
                )}
            </div>
        </div>
    );
}
