import React, { createContext, useContext, useState, useCallback } from 'react';

interface PresentationContextType {
    showPresentation: boolean;
    startPresentation: () => void;
    stopPresentation: () => void;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export function PresentationProvider({ children }: { children: React.ReactNode }) {
    const [showPresentation, setShowPresentation] = useState(false);

    const startPresentation = useCallback(() => {
        console.log('🚀 [PresentationContext] startPresentation called! Setting showPresentation to true');
        setShowPresentation(true);
    }, []);

    const stopPresentation = useCallback(() => {
        console.log('🛑 [PresentationContext] stopPresentation called! Setting showPresentation to false');
        setShowPresentation(false);
    }, []);

    console.log('📺 [PresentationContext] Current state:', showPresentation);

    return (
        <PresentationContext.Provider value={{ showPresentation, startPresentation, stopPresentation }}>
            {children}
        </PresentationContext.Provider>
    );
}

export function usePresentation() {
    const context = useContext(PresentationContext);
    if (context === undefined) {
        throw new Error('usePresentation must be used within a PresentationProvider');
    }
    return context;
}

// Hook that's safe to use outside provider (returns defaults)
export function usePresentationSafe() {
    const context = useContext(PresentationContext);
    if (!context) {
        console.log('⚠️ [PresentationContext] usePresentationSafe: No context found, returning defaults');
    }
    return context ?? {
        showPresentation: false,
        startPresentation: () => { console.log('⚠️ startPresentation called but no context!'); },
        stopPresentation: () => { console.log('⚠️ stopPresentation called but no context!'); }
    };
}
