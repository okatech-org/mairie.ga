import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, FileText, Sparkles, Brain, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OCRProgressIndicatorProps {
    isAnalyzing: boolean;
    progress: number;
    currentStep?: 'uploading' | 'scanning' | 'extracting' | 'validating' | 'completed';
    fileName?: string;
    extractedFieldsCount?: number;
}

const stepLabels = {
    uploading: 'Chargement du document...',
    scanning: 'Scan optique en cours...',
    extracting: 'Extraction des données IA...',
    validating: 'Validation des informations...',
    completed: 'Analyse terminée !'
};

const stepIcons = {
    uploading: FileText,
    scanning: Eye,
    extracting: Brain,
    validating: Sparkles,
    completed: CheckCircle
};

export const OCRProgressIndicator: React.FC<OCRProgressIndicatorProps> = ({
    isAnalyzing,
    progress,
    currentStep = 'scanning',
    fileName,
    extractedFieldsCount
}) => {
    const StepIcon = stepIcons[currentStep];
    
    if (!isAnalyzing && currentStep !== 'completed') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed bottom-24 right-6 z-50"
            >
                <motion.div
                    className="bg-card border border-border rounded-2xl shadow-2xl p-4 min-w-[280px] backdrop-blur-lg"
                    animate={{
                        boxShadow: currentStep === 'completed' 
                            ? '0 0 30px hsl(var(--primary) / 0.3)' 
                            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}
                >
                    {/* Header with animated icon */}
                    <div className="flex items-center gap-3 mb-3">
                        <motion.div
                            className={`p-2 rounded-xl ${
                                currentStep === 'completed' 
                                    ? 'bg-green-500/10 text-green-500' 
                                    : 'bg-primary/10 text-primary'
                            }`}
                            animate={currentStep !== 'completed' ? {
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            } : {}}
                            transition={{
                                duration: 2,
                                repeat: currentStep !== 'completed' ? Infinity : 0,
                                ease: "easeInOut"
                            }}
                        >
                            {currentStep === 'completed' ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <StepIcon className="w-5 h-5" />
                            )}
                        </motion.div>
                        
                        <div className="flex-1">
                            <p className="font-semibold text-sm">
                                {currentStep === 'completed' ? 'Analyse terminée' : 'Analyse OCR iAsted'}
                            </p>
                            {fileName && (
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                    {fileName}
                                </p>
                            )}
                        </div>
                        
                        {currentStep !== 'completed' && (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                    </div>

                    {/* Progress bar with animated gradient */}
                    <div className="relative mb-3">
                        <Progress 
                            value={progress} 
                            className="h-2 bg-muted overflow-hidden"
                        />
                        {currentStep !== 'completed' && (
                            <motion.div
                                className="absolute inset-0 h-2 rounded-full overflow-hidden"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)',
                                    backgroundSize: '200% 100%'
                                }}
                                animate={{
                                    backgroundPosition: ['100% 0%', '-100% 0%']
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'linear'
                                }}
                            />
                        )}
                    </div>

                    {/* Step label */}
                    <motion.p
                        key={currentStep}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-muted-foreground"
                    >
                        {stepLabels[currentStep]}
                    </motion.p>

                    {/* Extracted fields counter */}
                    {extractedFieldsCount !== undefined && extractedFieldsCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-2 flex items-center gap-1 text-xs text-green-600"
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>{extractedFieldsCount} champs extraits</span>
                        </motion.div>
                    )}

                    {/* Animated dots for processing */}
                    {currentStep !== 'completed' && (
                        <div className="flex gap-1 mt-2">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-primary"
                                    animate={{
                                        opacity: [0.3, 1, 0.3],
                                        scale: [0.8, 1.2, 0.8]
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: i * 0.2
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Hook to manage OCR progress state
export function useOCRProgress() {
    const [state, setState] = React.useState({
        isAnalyzing: false,
        progress: 0,
        currentStep: 'scanning' as OCRProgressIndicatorProps['currentStep'],
        fileName: undefined as string | undefined,
        extractedFieldsCount: 0
    });

    const startAnalysis = (fileName: string) => {
        setState({
            isAnalyzing: true,
            progress: 0,
            currentStep: 'uploading',
            fileName,
            extractedFieldsCount: 0
        });
    };

    const updateProgress = (progress: number, step: OCRProgressIndicatorProps['currentStep']) => {
        setState(prev => ({
            ...prev,
            progress,
            currentStep: step
        }));
    };

    const completeAnalysis = (extractedFieldsCount: number) => {
        setState(prev => ({
            ...prev,
            isAnalyzing: false,
            progress: 100,
            currentStep: 'completed',
            extractedFieldsCount
        }));

        // Auto-hide after 3 seconds
        setTimeout(() => {
            setState(prev => ({
                ...prev,
                currentStep: undefined
            }));
        }, 3000);
    };

    const reset = () => {
        setState({
            isAnalyzing: false,
            progress: 0,
            currentStep: 'scanning',
            fileName: undefined,
            extractedFieldsCount: 0
        });
    };

    return {
        ...state,
        startAnalysis,
        updateProgress,
        completeAnalysis,
        reset
    };
}
