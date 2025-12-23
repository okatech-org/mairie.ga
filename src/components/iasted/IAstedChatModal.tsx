import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { generateOfficialPDFWithURL } from '@/utils/generateOfficialPDF';
import { documentGenerationService } from '@/services/documentGenerationService';
import { canUseCorrespondance } from '@/config/iasted-prompt-lite';
import { invokeWithDemoFallback } from '@/utils/demoMode';
import { useGeneratedDocumentsStore } from '@/stores/generatedDocumentsStore';
import {
    Send,
    Loader2,
    X,
    Bot,
    User,
    FileText,
    Download,
    Brain,
    Mic,
    MicOff,
    Navigation,
    Settings,
    FileCheck,
    Trash2,
    Edit,
    Copy,
    MoreVertical,
    RefreshCw,
    MessageSquare,
    Phone,
    ExternalLink,
    Video,
    Users,
    FolderPlus,
    Mail,
    Send as SendIcon,
    UserCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioVideoInterface } from './AudioVideoInterface';
import { MeetingInterface } from './MeetingInterface';
import { ContactsDirectory } from '@/components/contacts/ContactsDirectory';
import { IChatPanel, IAppelPanel, IReunionPanel, IContactPanel } from '@/components/icom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeVoiceWebRTC, UseRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { DocumentUploadZone } from '@/components/iasted/DocumentUploadZone';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: {
        responseStyle?: string;
        documents?: Array<{
            id: string;
            name: string;
            url: string;
            type: string;
        }>;
    };
}

interface IAstedChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    openaiRTC: UseRealtimeVoiceWebRTC;
    pendingDocument?: any;
    onClearPendingDocument?: () => void;
    currentVoice?: 'echo' | 'ash' | 'shimmer';
    systemPrompt?: string;
    userRole?: string;
    /** If false, displays simplified iCom branding without AI features */
    hasIAsted?: boolean;
}

const MessageBubble: React.FC<{
    message: Message;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, newContent: string) => void;
    onCopy?: (content: string) => void;
    onSaveToDocuments?: (doc: any) => void;
    onSendByMail?: (doc: any) => void;
    onSendByCorrespondance?: (doc: any) => void;
    userRole?: string;
}> = ({ message, onDelete, onEdit, onCopy, onSaveToDocuments, onSendByMail, onSendByCorrespondance, userRole }) => {
    const isUser = message.role === 'user';
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [showActions, setShowActions] = useState(false);
    const [fullscreenDoc, setFullscreenDoc] = useState<any>(null);
    const [pdfZoom, setPdfZoom] = useState(100);
    const [pdfPage, setPdfPage] = useState(1);
    const { toast } = useToast();

    const handleSaveEdit = () => {
        if (onEdit && editedContent.trim() !== message.content) {
            onEdit(message.id, editedContent.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(message.content);
        setIsEditing(false);
    };

    const handleDownloadDocument = (doc: any) => {
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
            title: "📥 Téléchargement",
            description: `${doc.name} téléchargé`,
        });
    };

    const handlePrintDocument = (doc: any) => {
        const printWindow = window.open(doc.url, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
            toast({
                title: "🖨️ Impression",
                description: `Ouverture de ${doc.name} pour impression`,
            });
        } else {
            toast({
                title: "❌ Erreur",
                description: "Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.",
                variant: "destructive",
            });
        }
    };

    return (
        <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'} relative`}>
                <div className="flex items-start gap-2">
                    {!isUser && (
                        <div className="neu-raised w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-success/10">
                            <Bot className="w-4 h-4 text-success" />
                        </div>
                    )}
                    <div className="flex-1">
                        <div
                            className={`rounded-2xl px-4 py-3 ${isUser
                                ? 'neu-raised bg-primary/10 text-foreground rounded-br-none'
                                : 'neu-inset text-foreground rounded-bl-none'
                                }`}
                        >
                            {isEditing ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="w-full min-h-[80px] p-2 bg-background/50 border border-border rounded text-sm resize-none"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-3 py-1 text-xs rounded bg-background/50 hover:bg-background transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            Enregistrer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                            )}

                            {/* Documents attachés avec prévisualisation PDF */}
                            {message.metadata?.documents && message.metadata.documents.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/20 space-y-3">
                                    {message.metadata.documents.map((doc) => (
                                        <div key={doc.id} className="space-y-2">
                                            {/* Nom et boutons d'action */}
                                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                                    <span className="text-xs font-medium truncate">{doc.name}</span>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => setFullscreenDoc(doc)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background/70 hover:bg-background text-foreground transition-colors"
                                                        title="Plein écran"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0-4h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadDocument(doc)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                                                        title="Télécharger"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-medium">Télécharger</span>
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Boutons d'action pour le document */}
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {onSaveToDocuments && (
                                                    <button
                                                        onClick={() => onSaveToDocuments(doc)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors"
                                                        title="Classer dans Mes Documents"
                                                    >
                                                        <FolderPlus className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-medium">Classer</span>
                                                    </button>
                                                )}
                                                {onSendByMail && (
                                                    <button
                                                        onClick={() => onSendByMail(doc)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors"
                                                        title="Envoyer par iBoîte"
                                                    >
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-medium">iBoîte</span>
                                                    </button>
                                                )}
                                                {onSendByCorrespondance && userRole && ['MAIRE', 'maire', 'MAIRE_ADJOINT', 'maire_adjoint', 'SECRETAIRE_GENERAL', 'secretaire_general', 'CHEF_SERVICE', 'chef_service', 'AGENT', 'agent', 'SUPER_ADMIN', 'super_admin', 'admin'].includes(userRole) && (
                                                    <button
                                                        onClick={() => onSendByCorrespondance(doc)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-600 transition-colors"
                                                        title="Envoyer par Correspondance (workflow d'approbation)"
                                                    >
                                                        <SendIcon className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-medium">Correspondance</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Modale plein écran pour PDF */}
                            <AnimatePresence>
                                {fullscreenDoc && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex flex-col"
                                        onClick={() => setFullscreenDoc(null)}
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-primary" />
                                                <span className="text-sm font-medium">{fullscreenDoc.name}</span>
                                            </div>

                                            {/* Contrôles */}
                                            <div className="flex items-center gap-4">
                                                {/* Zoom */}
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/70 border border-border">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPdfZoom(prev => Math.max(50, prev - 25));
                                                        }}
                                                        className="p-1 hover:bg-muted rounded transition-colors"
                                                        title="Zoom arrière"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-xs font-medium min-w-[3rem] text-center">{pdfZoom}%</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPdfZoom(prev => Math.min(200, prev + 25));
                                                        }}
                                                        className="p-1 hover:bg-muted rounded transition-colors"
                                                        title="Zoom avant"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPdfZoom(100);
                                                        }}
                                                        className="p-1 hover:bg-muted rounded transition-colors ml-1"
                                                        title="Réinitialiser"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Pagination */}
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/70 border border-border">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPdfPage(prev => Math.max(1, prev - 1));
                                                        }}
                                                        className="p-1 hover:bg-muted rounded transition-colors"
                                                        title="Page précédente"
                                                        disabled={pdfPage === 1}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-xs font-medium min-w-[4rem] text-center">Page {pdfPage}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPdfPage(prev => prev + 1);
                                                        }}
                                                        className="p-1 hover:bg-muted rounded transition-colors"
                                                        title="Page suivante"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePrintDocument(fullscreenDoc);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background hover:bg-muted transition-colors"
                                                    title="Imprimer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                    <span className="text-sm font-medium">Imprimer</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadDocument(fullscreenDoc);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Télécharger</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setFullscreenDoc(null);
                                                        setPdfZoom(100);
                                                        setPdfPage(1);
                                                    }}
                                                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-background hover:bg-muted transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* PDF Viewer - Direct iframe with fallback */}
                                        <div className="flex-1 p-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                            <div className="w-full h-full rounded-lg border border-border bg-background relative">
                                                {/* Essai avec iframe d'abord */}
                                                <iframe
                                                    src={`${fullscreenDoc.url}#toolbar=1&navpanes=0&scrollbar=1&page=${pdfPage}`}
                                                    className="w-full h-full rounded-lg"
                                                    title="PDF Viewer"
                                                    onError={() => {
                                                        // Le fallback s'affichera si l'iframe échoue
                                                    }}
                                                />
                                                {/* Fallback overlay qui s'affiche si l'iframe ne fonctionne pas */}
                                                <noscript>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center p-8 bg-background/95 backdrop-blur-sm">
                                                        <FileText className="w-20 h-20 text-primary/60" />
                                                        <div className="space-y-2">
                                                            <p className="text-xl font-semibold">Document PDF généré</p>
                                                            <p className="text-muted-foreground max-w-md">
                                                                Cliquez sur le bouton ci-dessous pour télécharger et consulter le document.
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(fullscreenDoc.url, '_blank');
                                                                }}
                                                                className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center gap-2"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                                Ouvrir dans un nouvel onglet
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownloadDocument(fullscreenDoc);
                                                                }}
                                                                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                Télécharger le PDF
                                                            </button>
                                                        </div>
                                                    </div>
                                                </noscript>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                                <span className="text-xs opacity-70">
                                    {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                                {!isUser && message.metadata?.responseStyle && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                        {message.metadata.responseStyle === 'concis' && '⚡ Concis'}
                                        {message.metadata.responseStyle === 'detaille' && '📊 Détaillé'}
                                        {message.metadata.responseStyle === 'strategique' && '🎯 Stratégique'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions au survol */}
                        <AnimatePresence>
                            {showActions && !isEditing && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute -top-2 right-0 flex gap-1 bg-background border border-border rounded-lg shadow-lg p-1"
                                >
                                    {isUser && onEdit && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                                            title="Éditer"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {onCopy && (
                                        <button
                                            onClick={() => onCopy(message.content)}
                                            className="p-1.5 hover:bg-primary/10 text-primary rounded transition-colors"
                                            title="Copier"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(message.id)}
                                            className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {isUser && (
                        <div className="neu-raised w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export const IAstedChatModal: React.FC<IAstedChatModalProps> = ({
    isOpen,
    onClose,
    openaiRTC,
    pendingDocument,
    onClearPendingDocument,
    currentVoice,
    systemPrompt,
    userRole = 'unknown',
    hasIAsted = true
}) => {
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>(() => {
        return currentVoice || (localStorage.getItem('iasted-voice-selection') as 'echo' | 'ash' | 'shimmer') || 'ash';
    });

    // Ref pour tracker si la session a été initialisée (évite les problèmes de timing)
    const sessionInitializedRef = useRef(false);
    // Ref pour tracker si un document a été généré avant ouverture du chat
    const hasDocumentRef = useRef(false);

    // Sync internal state with prop if it changes (e.g. via voice command)
    useEffect(() => {
        if (currentVoice && currentVoice !== selectedVoice) {
            setSelectedVoice(currentVoice);
        }
    }, [currentVoice]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { setTheme } = useTheme();

    // Auto-start voice when modal opens - WITH CONTEXT
    useEffect(() => {
        if (isOpen) {
            // Petit délai pour laisser l'UI se monter
            const timer = setTimeout(() => {
                if (!openaiRTC.isConnected) {
                    // Pass the systemPrompt so iAsted knows the user context immediately
                    openaiRTC.connect(selectedVoice, systemPrompt);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, selectedVoice, systemPrompt]); // Include systemPrompt in dependencies

    // Sync messages from OpenAI WebRTC
    useEffect(() => {
        if (openaiRTC.messages.length > 0) {
            const lastMsg = openaiRTC.messages[openaiRTC.messages.length - 1];
            setMessages(prev => {
                const existing = prev.find(m => m.id === lastMsg.id);
                if (!existing) {
                    return [...prev, lastMsg];
                }
                return prev.map(m => m.id === lastMsg.id ? lastMsg : m);
            });
        }
    }, [openaiRTC.messages]);

    // === Fonctions de gestion de messages ===

    const handleDeleteMessage = async (messageId: string) => {
        try {
            setMessages(prev => prev.filter(m => m.id !== messageId));

            // Supprimer aussi de la base de données
            if (sessionId) {
                const { error } = await supabase
                    .from('conversation_messages')
                    .delete()
                    .eq('id', messageId);

                if (error) console.error('Erreur suppression message:', error);
            }

            toast({
                title: "Message supprimé",
                duration: 2000,
            });
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleEditMessage = async (messageId: string, newContent: string) => {
        try {
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, content: newContent } : m
            ));

            // Mettre à jour dans la base de données
            if (sessionId) {
                const { error } = await supabase
                    .from('conversation_messages')
                    .update({ content: newContent })
                    .eq('id', messageId);

                if (error) console.error('Erreur modification message:', error);
            }

            toast({
                title: "Message modifié",
                duration: 2000,
            });
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleCopyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        toast({
            title: "📋 Copié",
            description: "Message copié dans le presse-papiers",
            duration: 2000,
        });
    };

    // === Document Action Handlers ===
    const { getDocument, getDocumentByUrl } = useGeneratedDocumentsStore();

    const handleSaveToDocuments = async (doc: any) => {
        console.log('📁 [handleSaveToDocuments] Document reçu:', doc);

        if (!doc || (!doc.url && !doc.id)) {
            console.error('📁 [handleSaveToDocuments] Document invalide:', doc);
            toast({
                title: "Erreur",
                description: "Document invalide",
                variant: "destructive",
            });
            return;
        }

        try {
            let blob: Blob;

            // 1. Essayer de récupérer depuis le store (priorité)
            const storedDoc = doc.id ? getDocument(doc.id) : getDocumentByUrl(doc.url);

            if (storedDoc) {
                console.log('📁 [handleSaveToDocuments] Blob récupéré depuis le store');
                blob = storedDoc.blob;
            } else {
                // 2. Fallback: essayer de fetch le blob URL (peut échouer si expiré)
                console.log('📁 [handleSaveToDocuments] Tentative fetch depuis URL:', doc.url);
                try {
                    const response = await fetch(doc.url);
                    if (!response.ok) {
                        throw new Error(`Échec récupération blob: ${response.status}`);
                    }
                    blob = await response.blob();
                    console.log('📁 [handleSaveToDocuments] Blob récupéré via fetch:', blob.size, 'bytes');
                } catch (fetchError) {
                    console.error('❌ [handleSaveToDocuments] Fetch échoué:', fetchError);
                    toast({
                        title: "Document expiré",
                        description: "Ce document a expiré. Veuillez le régénérer.",
                        variant: "destructive",
                    });
                    return;
                }
            }

            const file = new File([blob], doc.name, { type: doc.type || 'application/pdf' });
            console.log('📁 [handleSaveToDocuments] File créé:', file.name, file.type, file.size, 'bytes');

            // Utiliser documentService pour sauvegarder dans la table 'documents' 
            // (visible dans CitizenDocumentsPage)
            const { documentService } = await import('@/services/document-service');
            console.log('📁 [handleSaveToDocuments] Upload vers documents...');

            const result = await documentService.uploadDocument(file, 'OTHER');

            console.log('📁 [handleSaveToDocuments] Résultat upload:', result);

            toast({
                title: "📁 Document classé",
                description: `${doc.name} sauvegardé dans Mes Documents`,
            });
        } catch (error: any) {
            console.error('❌ [handleSaveToDocuments] Erreur:', error);
            toast({
                title: "Erreur",
                description: error.message || "Impossible de sauvegarder le document",
                variant: "destructive",
            });
        }
    };

    const handleSendByMail = async (doc: any) => {
        console.log('📧 [handleSendByMail] Document reçu:', doc);

        if (!doc) {
            console.error('📧 [handleSendByMail] Document invalide');
            return;
        }

        // S'assurer que le blob est stocké pour la page cible
        const storedDoc = doc.id ? getDocument(doc.id) : getDocumentByUrl(doc.url);
        if (!storedDoc && doc.url) {
            // Essayer de récupérer et stocker le blob
            try {
                const response = await fetch(doc.url);
                if (response.ok) {
                    const blob = await response.blob();
                    const { addDocument } = useGeneratedDocumentsStore.getState();
                    addDocument({
                        id: doc.id || crypto.randomUUID(),
                        name: doc.name,
                        blob: blob,
                        url: doc.url,
                        type: doc.type || 'application/pdf',
                    });
                }
            } catch (e) {
                console.warn('📧 [handleSendByMail] Impossible de stocker le blob:', e);
            }
        }

        // Navigate to messaging page with document attached
        navigate('/messaging', {
            state: {
                compose: true,
                subject: `Document: ${doc.name}`,
                attachments: [{ ...doc, storedId: doc.id }],
            }
        });

        console.log('📧 [handleSendByMail] Navigation vers /messaging avec attachement');
        onClose();

        toast({
            title: "📧 Redirection vers iBoîte",
            description: "Composez votre message avec le document en pièce jointe",
        });
    };

    const handleSendByCorrespondance = async (doc: any) => {
        console.log('📨 [handleSendByCorrespondance] Document reçu:', doc);

        if (!doc) {
            console.error('📨 [handleSendByCorrespondance] Document invalide');
            return;
        }

        // S'assurer que le blob est stocké pour la page cible
        const storedDoc = doc.id ? getDocument(doc.id) : getDocumentByUrl(doc.url);
        if (!storedDoc && doc.url) {
            try {
                const response = await fetch(doc.url);
                if (response.ok) {
                    const blob = await response.blob();
                    const { addDocument } = useGeneratedDocumentsStore.getState();
                    addDocument({
                        id: doc.id || crypto.randomUUID(),
                        name: doc.name,
                        blob: blob,
                        url: doc.url,
                        type: doc.type || 'application/pdf',
                    });
                }
            } catch (e) {
                console.warn('📨 [handleSendByCorrespondance] Impossible de stocker le blob:', e);
            }
        }

        // Navigate to correspondance page to start approval workflow
        navigate('/icorrespondance', {
            state: {
                newCorrespondance: true,
                document: { ...doc, storedId: doc.id },
            }
        });

        console.log('📨 [handleSendByCorrespondance] Navigation vers /icorrespondance');
        onClose();

        toast({
            title: "📨 Redirection vers iCorrespondance",
            description: "Le document sera soumis au workflow d'approbation",
        });
    };

    const handleClearConversation = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer toute la conversation ?')) {
            setMessages([]);
            openaiRTC.clearSession(); // Clear WebRTC session history
            if (sessionId) {
                // Supprimer tous les messages de la session
                const { error: deleteError } = await supabase
                    .from('conversation_messages')
                    .delete()
                    .eq('session_id', sessionId);

                if (deleteError) {
                    console.error('Erreur suppression messages:', deleteError);
                }

                // Marquer la session comme inactive
                const { error: updateError } = await supabase
                    .from('conversation_sessions')
                    .update({
                        is_active: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', sessionId);

                if (updateError) {
                    console.error('Erreur mise à jour session:', updateError);
                }
            }
            toast({
                title: "Conversation effacée",
                duration: 2000,
            });
        }
    };

    const handleNewConversation = async () => {
        setMessages([]);
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Créer nouvelle session avec colonnes correctes
            await supabase.from('conversation_sessions').insert({
                id: newSessionId,
                user_id: user.id,
                title: 'Nouvelle conversation',
                is_active: true,
            });
        }

        toast({
            title: "✨ Nouvelle conversation",
            duration: 2000,
        });
    };


    // Initialiser la session au montage
    useEffect(() => {
        if (isOpen && !sessionInitializedRef.current && !hasDocumentRef.current) {
            initializeSession();
        }

        // Réinitialiser les refs quand le modal se ferme
        if (!isOpen) {
            sessionInitializedRef.current = false;
            hasDocumentRef.current = false;
        }
    }, [isOpen]);

    // Gérer la génération de documents déclenchée par commande vocale
    // P4: Ajout d'un flag pour éviter la double génération
    const pendingDocumentProcessed = useRef<string | null>(null);

    useEffect(() => {
        if (pendingDocument && onClearPendingDocument) {
            // P4: Vérifier si ce document a déjà été traité
            const docKey = `${pendingDocument.type}-${pendingDocument.subject}-${pendingDocument.recipient}`;
            if (pendingDocumentProcessed.current === docKey) {
                console.log('⏭️ [IAstedChatModal] Document déjà traité, skip:', docKey);
                onClearPendingDocument();
                return;
            }

            console.log('📄 [IAstedChatModal] Génération de document depuis voix:', pendingDocument);

            // Marquer comme traité
            pendingDocumentProcessed.current = docKey;

            // Marquer qu'un document est en cours - empêche l'init d'écraser les messages
            hasDocumentRef.current = true;

            // Créer un tool call simulé pour réutiliser la logique existante
            const toolCall = {
                function: {
                    name: 'generate_document',
                    arguments: JSON.stringify({
                        type: pendingDocument.type,
                        recipient: pendingDocument.recipient,
                        subject: pendingDocument.subject,
                        content_points: pendingDocument.contentPoints,
                        format: pendingDocument.format || 'pdf',
                        service_context: pendingDocument.serviceContext
                    })
                }
            };

            executeToolCall(toolCall);
            onClearPendingDocument();

            // Reset le flag après un délai
            setTimeout(() => {
                pendingDocumentProcessed.current = null;
            }, 5000);
        }
    }, [pendingDocument, onClearPendingDocument]);

    // Écouter l'événement de création de document depuis IAstedInterface
    useEffect(() => {
        const handleDocumentCreated = (event: CustomEvent) => {
            const { documentId, fileName, localUrl, recipient, recipientOrg, subject } = event.detail;

            console.log('📄 [IAstedChatModal] Document créé reçu:', event.detail);

            // Ajouter le document comme message dans le chat
            const docMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `📄 **Courrier généré**\n\n**Destinataire**: ${recipient} (${recipientOrg || 'Organisation'})\n**Objet**: ${subject}\n\nLe document est prêt. Vous pouvez le télécharger, l'imprimer ou l'envoyer.`,
                timestamp: new Date().toISOString(),
                metadata: {
                    documents: [{
                        id: documentId,
                        name: fileName,
                        url: localUrl,
                        type: 'application/pdf',
                    }],
                },
            };

            setMessages(prev => [...prev, docMessage]);
        };

        window.addEventListener('iasted-document-created', handleDocumentCreated as EventListener);

        return () => {
            window.removeEventListener('iasted-document-created', handleDocumentCreated as EventListener);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const initializeSession = async () => {
        try {
            console.log('🔄 [IAstedChatModal] Initialisation session...');

            // Vérifier si déjà initialisé via ref (plus fiable que le state)
            if (sessionInitializedRef.current) {
                console.log('ℹ️ [IAstedChatModal] Session déjà initialisée (ref), skip');
                return;
            }

            // Vérifier si un document est en cours de génération
            if (hasDocumentRef.current) {
                console.log('ℹ️ [IAstedChatModal] Document en cours, skip init');
                return;
            }

            // Ne pas réinitialiser si on a déjà une session et des messages
            if (sessionId && messages.length > 0) {
                console.log('ℹ️ [IAstedChatModal] Session existe déjà avec des messages, skip init');
                sessionInitializedRef.current = true;
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();

            // Mode démo : pas d'utilisateur authentifié, utiliser session locale
            if (!user) {
                console.log('ℹ️ [IAstedChatModal] Mode démo - session locale uniquement');

                // Ne créer une session que si pas encore de sessionId
                if (!sessionId) {
                    const demoSessionId = `demo-${crypto.randomUUID()}`;
                    setSessionId(demoSessionId);
                }

                // Ne pas écraser les messages existants (ex: document généré)
                if (messages.length === 0) {
                    const greetingMessage: Message = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: `Bonjour,\n\nJe suis iAsted, votre assistant municipal intelligent. Comment puis-je vous aider aujourd'hui ?`,
                        timestamp: new Date().toISOString(),
                        metadata: { responseStyle: 'strategique' },
                    };
                    setMessages([greetingMessage]);
                }

                console.log('✅ [IAstedChatModal] Session démo prête');
                return;
            }

            // Utilisateur authentifié : chercher ou créer une session persistante
            const { data: existingSession } = await supabase
                .from('conversation_sessions')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingSession) {
                setSessionId(existingSession.id);
                await loadSessionMessages(existingSession.id);
            } else {
                const { data: newSession, error } = await supabase
                    .from('conversation_sessions')
                    .insert({
                        user_id: user.id,
                        title: 'Conversation iAsted',
                        is_active: true,
                    })
                    .select()
                    .single();

                if (error) throw error;
                setSessionId(newSession.id);

                // Ne pas écraser les messages existants (ex: document généré)
                if (messages.length === 0) {
                    // Message de bienvenue
                    const greetingMessage: Message = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: `Bonjour,\n\nJe suis iAsted, votre assistant stratégique. Comment puis-je vous aider aujourd'hui ?`,
                        timestamp: new Date().toISOString(),
                        metadata: { responseStyle: 'strategique' },
                    };
                    setMessages([greetingMessage]);
                    await saveMessage(newSession.id, greetingMessage);
                }
            }

            console.log('✅ [IAstedChatModal] Session prête');
            sessionInitializedRef.current = true;
        } catch (error) {
            console.error('❌ [IAstedChatModal] Erreur initialisation:', error);
            // Fallback en mode démo local
            if (!sessionId) {
                const demoSessionId = `demo-fallback-${crypto.randomUUID()}`;
                setSessionId(demoSessionId);
            }
            // Ne pas écraser les messages existants
            if (messages.length === 0) {
                const greetingMessage: Message = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `Bonjour,\n\nJe suis iAsted. Je fonctionne en mode local. Comment puis-je vous aider ?`,
                    timestamp: new Date().toISOString(),
                };
                setMessages([greetingMessage]);
            }
        }
    };

    const loadSessionMessages = async (sessionId: string) => {
        const { data: msgs, error } = await supabase
            .from('conversation_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (!error && msgs) {
            setMessages(msgs.map(m => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: m.created_at,
            })));
        }
    };

    // Fonction d'exécution des tool calls
    const executeToolCall = async (toolCall: any) => {
        try {
            const args = JSON.parse(toolCall.function.arguments);
            const toolName = toolCall.function.name;
            console.log('🔧 [executeToolCall]', toolName, args);

            // Access control: Block correspondance tools for non-municipal staff
            const CORRESPONDANCE_TOOLS = ['read_correspondence', 'file_correspondence', 'create_correspondence', 'send_correspondence'];
            if (CORRESPONDANCE_TOOLS.includes(toolName) && !canUseCorrespondance(userRole)) {
                console.warn(`🚫 [executeToolCall] Access denied for ${toolName} - role: ${userRole}`);
                toast({
                    title: "Accès refusé",
                    description: "La fonctionnalité Correspondances est réservée au personnel municipal.",
                    variant: "destructive",
                });
                return;
            }

            switch (toolName) {
                case 'navigate_app':
                    toast({
                        title: "Navigation",
                        description: `Redirection vers ${args.route}...`,
                        duration: 2000,
                    });
                    navigate(args.route);

                    // Si un module spécifique est demandé, scroller vers lui
                    if (args.module_id) {
                        setTimeout(() => {
                            const element = document.getElementById(args.module_id);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                element.classList.add('ring-2', 'ring-primary', 'animate-pulse');
                                setTimeout(() => {
                                    element.classList.remove('ring-2', 'ring-primary', 'animate-pulse');
                                }, 3000);
                            }
                        }, 500);
                    }
                    break;

                case 'generate_document':
                    // Gérer le format (PDF ou Docx)
                    const requestedFormat = args.format || 'pdf';
                    console.log(`📄 [generateDocument] Format demandé: ${requestedFormat}`, args);

                    try {
                        let blob: Blob, url: string, filename: string;

                        // P4: Enrichir le contenu si vide ou insuffisant
                        let enrichedContentPoints = args.content_points || [];
                        const needsEnrichment = !enrichedContentPoints.length ||
                            enrichedContentPoints.every((p: string) => !p || p.length < 30);

                        if (needsEnrichment && args.subject) {
                            console.log('📄 [generateDocument] Contenu insuffisant, enrichissement...');
                            try {
                                const { correspondanceService } = await import('@/services/correspondanceService');
                                // Use private method via workaround
                                const enrichResult = await (correspondanceService as any).enrichContent?.({
                                    documentType: args.type,
                                    subject: args.subject,
                                    userInput: enrichedContentPoints.join(' '),
                                    recipient: args.recipient,
                                    recipientOrg: args.recipient_org
                                });

                                if (enrichResult?.success && enrichResult.contentPoints?.length) {
                                    enrichedContentPoints = enrichResult.contentPoints;
                                    console.log('✅ [generateDocument] Contenu enrichi:', enrichedContentPoints.length, 'paragraphes');
                                }
                            } catch (enrichError) {
                                console.warn('⚠️ [generateDocument] Enrichissement échoué, fallback:', enrichError);
                                // Fallback: générer un contenu basique
                                enrichedContentPoints = [
                                    `Suite à la demande concernant "${args.subject}",`,
                                    'nous avons le plaisir de vous informer que votre dossier a été traité avec la plus grande attention.',
                                    'Nous restons à votre entière disposition pour tout complément d\'information.'
                                ];
                            }
                        }

                        if (requestedFormat === 'docx') {
                            // Génération DOCX locale sans upload vers Supabase
                            console.log('📄 [generateDOCX] Génération locale du DOCX');

                            const { Document, Paragraph, AlignmentType, HeadingLevel, Packer } = await import('docx');

                            const title = `${args.type} - ${args.recipient}`;
                            const contentPoints = enrichedContentPoints;

                            const doc = new Document({
                                sections: [{
                                    properties: {},
                                    children: [
                                        new Paragraph({
                                            text: "RÉPUBLIQUE GABONAISE",
                                            heading: HeadingLevel.HEADING_1,
                                            alignment: AlignmentType.CENTER,
                                        }),
                                        new Paragraph({
                                            text: title,
                                            heading: HeadingLevel.HEADING_2,
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 400, after: 400 },
                                        }),
                                        new Paragraph({
                                            text: `Destinataire: ${args.recipient}`,
                                            spacing: { before: 200, after: 200 },
                                        }),
                                        new Paragraph({
                                            text: `Objet: ${args.subject}`,
                                            spacing: { after: 200 },
                                        }),
                                        new Paragraph({
                                            text: `Date: ${new Date().toLocaleDateString('fr-FR')}`,
                                            spacing: { after: 400 },
                                        }),
                                        ...contentPoints.map((point: string) =>
                                            new Paragraph({
                                                text: point,
                                                spacing: { before: 200, after: 200 },
                                            })
                                        ),
                                    ],
                                }],
                            });

                            blob = await Packer.toBlob(doc);
                            filename = `${args.type}_${args.recipient.replace(/\s+/g, '_')}_${Date.now()}.docx`;
                            url = URL.createObjectURL(blob);

                            console.log('✅ [generateDOCX] Document généré:', filename);
                        } else {
                            // Génération PDF existante - P4: utiliser enrichedContentPoints
                            const pdfResult = await generateOfficialPDFWithURL({
                                type: args.type,
                                recipient: args.recipient,
                                subject: args.subject,
                                content_points: enrichedContentPoints,
                                signature_authority: args.signature_authority,
                                serviceContext: args.service_context
                            });

                            blob = pdfResult.blob;
                            url = pdfResult.url;
                            filename = pdfResult.filename;

                            console.log('✅ [generatePDF] Document généré:', filename);
                        }

                        // Créer l'objet document pour le chat
                        const docId = crypto.randomUUID();
                        const docPreview = {
                            id: docId,
                            name: filename,
                            url: url,  // URL blob pour téléchargement
                            type: requestedFormat === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
                        };

                        // Stocker le blob dans le store pour récupération ultérieure
                        const { addDocument } = useGeneratedDocumentsStore.getState();
                        addDocument({
                            id: docId,
                            name: filename,
                            blob: blob,
                            url: url,
                            type: docPreview.type,
                        });
                        console.log('📄 [generateDocument] Blob stocké dans le store:', docId);

                        // Créer un message assistant dédié avec le document attaché
                        const now = new Date().toISOString();
                        const docType = (args.type || 'document').toUpperCase();
                        const docRecipient = args.recipient || 'les destinataires';
                        const docSubject = args.subject || 'Document officiel';
                        const content = `Document généré, Excellence.\n\n📄 ${docType} pour ${docRecipient}\nObjet : ${docSubject}`;
                        const docMessage: Message = {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content,
                            timestamp: now,
                            metadata: {
                                responseStyle: 'strategique',
                                documents: [docPreview],
                            },
                        };

                        setMessages(prev => [...prev, docMessage]);

                        // Toast de succès
                        toast({
                            title: "📄 Document généré",
                            description: `${docType} pour ${docRecipient}`,
                            duration: 3000,
                        });

                        // Télécharger automatiquement le PDF au lieu de l'ouvrir (évite ERR_BLOCKED_BY_CLIENT)
                        // Si on est en mode vocal (connecté), on télécharge auto
                        if (openaiRTC.isConnected) {
                            console.log('🔊 [generatePDF] Téléchargement automatique (demande vocale)');
                            setTimeout(() => {
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = filename;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }, 500);
                        }

                    } catch (error) {
                        console.error('❌ [generatePDF] Erreur:', error);
                        toast({
                            title: "Erreur de génération",
                            description: "Impossible de créer le document PDF",
                            variant: "destructive",
                        });
                    }
                    break;

                // ============= CORRESPONDANCE TOOLS (Maire, Adjoint, SG) =============
                case 'read_correspondence': {
                    const { correspondanceService } = await import('@/services/correspondanceService');
                    try {
                        const result = await correspondanceService.readCorrespondance(args.folder_id);

                        const msgContent = `📂 **${result.folderName}**\n\n${result.summary}`;
                        setMessages(prev => [...prev, {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: msgContent,
                            timestamp: new Date().toISOString(),
                        }]);

                        toast({
                            title: "📖 Correspondance lue",
                            description: `Dossier: ${result.folderName}`,
                        });
                    } catch (error: any) {
                        toast({
                            title: "Erreur",
                            description: error.message,
                            variant: "destructive",
                        });
                    }
                    break;
                }

                case 'file_correspondence': {
                    const { correspondanceService } = await import('@/services/correspondanceService');
                    try {
                        const result = await correspondanceService.fileToDocuments(args.folder_id);

                        toast({
                            title: "📁 Classé dans Documents",
                            description: `${result.documentIds.length} fichier(s) copié(s)`,
                        });

                        setMessages(prev => [...prev, {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: `Dossier classé avec succès dans vos documents. ${result.documentIds.length} fichier(s) copié(s) vers: ${result.destinationPath}`,
                            timestamp: new Date().toISOString(),
                        }]);
                    } catch (error: any) {
                        toast({
                            title: "Erreur de classement",
                            description: error.message,
                            variant: "destructive",
                        });
                    }
                    break;
                }

                case 'create_correspondence': {
                    const { correspondanceService } = await import('@/services/correspondanceService');
                    try {
                        // P4: Enrichir le contenu si insuffisant
                        let enrichedContentPoints = args.content_points || [];
                        const needsEnrichment = !enrichedContentPoints.length ||
                            enrichedContentPoints.every((p: string) => !p || p.length < 30);

                        if (needsEnrichment && args.subject) {
                            console.log('📄 [create_correspondence] Contenu insuffisant, enrichissement...');
                            const enrichResult = await correspondanceService.enrichContent({
                                documentType: args.template || 'courrier',
                                subject: args.subject,
                                userInput: enrichedContentPoints.join(' '),
                                recipient: args.recipient,
                                recipientOrg: args.recipient_org
                            });

                            if (enrichResult?.success && enrichResult.contentPoints?.length) {
                                enrichedContentPoints = enrichResult.contentPoints;
                                console.log('✅ [create_correspondence] Contenu enrichi:', enrichedContentPoints.length, 'paragraphes');
                            }
                        }

                        const result = await correspondanceService.createCorrespondance({
                            recipient: args.recipient,
                            recipientOrg: args.recipient_org,
                            recipientEmail: args.recipient_email,
                            subject: args.subject,
                            contentPoints: enrichedContentPoints,
                            template: args.template || 'courrier',
                        });

                        const docId = result.documentId || crypto.randomUUID();
                        const docPreview = {
                            id: docId,
                            name: result.fileName,
                            url: result.localUrl,
                            type: 'application/pdf',
                        };

                        // Stocker le blob dans le store
                        const { addDocument } = useGeneratedDocumentsStore.getState();
                        addDocument({
                            id: docId,
                            name: result.fileName,
                            blob: result.blob,
                            url: result.localUrl,
                            type: 'application/pdf',
                        });
                        console.log('📄 [create_correspondence] Blob stocké dans le store:', docId);

                        setMessages(prev => [...prev, {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: `📄 Courrier généré pour **${args.recipient}** (${args.recipient_org})\n\nObjet: ${args.subject}`,
                            timestamp: new Date().toISOString(),
                            metadata: { documents: [docPreview] },
                        }]);

                        toast({
                            title: "📄 Courrier PDF créé",
                            description: `Pour: ${args.recipient}`,
                        });

                        // Auto-download if voice mode
                        if (openaiRTC.isConnected) {
                            setTimeout(() => {
                                const link = document.createElement('a');
                                link.href = result.localUrl;
                                link.download = result.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }, 500);
                        }

                        // P4: Envoyer immédiatement si demandé et email fourni
                        if (args.send_immediately && args.recipient_email) {
                            console.log('📤 [create_correspondence] Envoi immédiat demandé...');
                            const sendResult = await correspondanceService.sendCorrespondance({
                                recipientEmail: args.recipient_email,
                                recipientName: args.recipient,
                                recipientOrg: args.recipient_org,
                                subject: args.subject,
                                body: `Veuillez trouver ci-joint notre correspondance concernant: ${args.subject}`,
                                documentId: docId,
                            });

                            if (sendResult.success) {
                                toast({
                                    title: "✉️ Courrier envoyé",
                                    description: `Email envoyé à ${args.recipient_email}`,
                                });

                                setMessages(prev => [...prev, {
                                    id: crypto.randomUUID(),
                                    role: 'assistant',
                                    content: `✉️ Courrier également envoyé par email à **${args.recipient_email}**`,
                                    timestamp: new Date().toISOString(),
                                }]);
                            }
                        }
                    } catch (error: any) {
                        toast({
                            title: "Erreur de création",
                            description: error.message,
                            variant: "destructive",
                        });
                    }
                    break;
                }

                case 'send_correspondence': {
                    const { correspondanceService } = await import('@/services/correspondanceService');
                    try {
                        if (!args.recipient_email) {
                            throw new Error('Email du destinataire requis pour l\'envoi');
                        }

                        const result = await correspondanceService.sendCorrespondance({
                            recipientEmail: args.recipient_email,
                            recipientName: args.recipient_name,
                            recipientOrg: args.recipient_org,
                            subject: args.subject || 'Correspondance officielle',
                            body: args.body || 'Veuillez trouver ci-joint notre correspondance officielle.',
                            documentId: args.document_id,
                        });

                        toast({
                            title: "✉️ Courrier envoyé",
                            description: `Email envoyé à ${args.recipient_email}`,
                        });

                        setMessages(prev => [...prev, {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: `✉️ Courrier envoyé avec succès à **${args.recipient_email}**.\n\nEnvoyé le: ${new Date(result.sentAt).toLocaleString('fr-FR')}`,
                            timestamp: new Date().toISOString(),
                        }]);
                    } catch (error: any) {
                        console.error('[send_correspondence] Erreur:', error);
                        toast({
                            title: "Erreur d'envoi",
                            description: error.message,
                            variant: "destructive",
                        });
                    }
                    break;
                }

                case 'manage_system_settings':
                    if (args.setting === 'voice_mode') {
                        // Legacy support or ignore
                        console.log('Setting voice mode via tool is deprecated');
                    } else if (args.setting === 'theme') {
                        setTheme(args.value);
                        toast({
                            title: "Thème changé",
                            description: `Nouveau thème: ${args.value}`,
                        });
                    }
                    break;

                default:
                    console.warn('⚠️ [executeToolCall] Outil non reconnu:', toolName);
            }
        } catch (error) {
            console.error('❌ [executeToolCall] Erreur:', error);
            toast({
                title: "Erreur",
                description: "Impossible d'exécuter l'action",
                variant: "destructive",
            });
        }
    };

    // Sauvegarder le message dans Supabase
    const saveMessage = async (sessionId: string, message: Message) => {
        try {
            const { error } = await supabase
                .from('conversation_messages')
                .insert({
                    session_id: sessionId,
                    role: message.role,
                    content: message.content,
                    metadata: message.metadata || {},
                });

            if (error) throw error;
        } catch (error) {
            console.error('❌ [saveMessage] Erreur:', JSON.stringify(error, null, 2));
        }
    };

    // Gestion de l'envoi de message texte
    const handleSendMessage = async () => {
        if (!inputText.trim() || isProcessing) return;

        const userContent = inputText.trim();
        setInputText('');
        setIsProcessing(true);

        // 1. Ajouter message utilisateur
        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: userContent,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        if (sessionId) await saveMessage(sessionId, userMessage);

        // 2. Envoyer à l'API (via Edge Function pour streaming ou standard)
        // Pour l'instant, on utilise une simple simulation ou appel standard si pas en mode vocal
        // Si on est en mode vocal, on devrait peut-être utiliser le canal de données ?
        // Mais ici c'est le chat texte.

        try {
            // Si connecté en WebRTC, on peut envoyer un message texte via le data channel si supporté,
            // mais pour l'instant le hook WebRTC gère surtout l'audio.
            // On va utiliser l'API standard de chat pour le texte.

            interface ChatResponse {
                answer: string;
                tool_calls?: Array<{ name: string; arguments: Record<string, unknown> }>;
            }

            const { data, error, isDemo } = await invokeWithDemoFallback<ChatResponse>('chat-with-iasted', {
                message: userContent,
                conversationHistory: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                sessionId: sessionId,
                systemPrompt: "Vous êtes iAsted, l'assistant du Président. Soyez concis et direct.",
                generateAudio: false // Pas d'audio pour le chat texte
            });

            if (error) throw error;

            if (isDemo) {
                console.log('[iAsted] Using demo mode response');
            }

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data?.answer || 'Je suis en mode démonstration. Comment puis-je vous aider ?',
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, assistantMessage]);
            if (sessionId) await saveMessage(sessionId, assistantMessage);

            // Vérifier les tool calls
            if (data?.tool_calls) {
                for (const toolCall of data.tool_calls) {
                    await executeToolCall(toolCall);
                }
            }

        } catch (error) {
            console.error('Erreur chat:', error);
            toast({
                title: "Erreur",
                description: "Impossible d'envoyer le message",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Clean up voice connections on unmount
    useEffect(() => {
        return () => {
            if (openaiRTC.isConnected) {
                openaiRTC.disconnect();
            }
        };
    }, [openaiRTC.isConnected]);

    const handleConnect = async () => {
        if (openaiRTC.isConnected) {
            openaiRTC.disconnect();
        } else {
            await openaiRTC.connect(selectedVoice, systemPrompt);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background border border-border/50 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-border/50 bg-card/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center p-3 bg-primary/10 border border-primary/20">
                                {hasIAsted ? (
                                    <Brain className="w-7 h-7 text-primary" />
                                ) : (
                                    <MessageSquare className="w-7 h-7 text-primary" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">
                                    {hasIAsted ? 'iAsted - iChat Stratégique' : 'iCom - Communications'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {hasIAsted ? 'Agent de Commande Totale' : 'Messagerie unifiée'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Boutons de gestion de conversation */}
                            <button
                                onClick={handleNewConversation}
                                className="neu-button-sm flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                                title="Nouvelle conversation"
                            > <RefreshCw className="w-4 h-4" />
                                <span className="hidden sm:inline">Nouvelle</span>
                            </button>

                            <button
                                onClick={handleClearConversation}
                                className="neu-button-sm flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                                title="Supprimer tout l'historique"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Voice Selector - Only shown when iAsted is available */}
                            {hasIAsted && (
                                <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1 border border-border/50">
                                    <button
                                        onClick={async () => {
                                            setSelectedVoice('ash');
                                            localStorage.setItem('iasted-voice-selection', 'ash');
                                            if (openaiRTC.isConnected) {
                                                await openaiRTC.disconnect();
                                                await openaiRTC.connect('ash');
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedVoice === 'ash'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-background/80'
                                            }`}
                                    >
                                        Homme
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setSelectedVoice('shimmer');
                                            localStorage.setItem('iasted-voice-selection', 'shimmer');
                                            if (openaiRTC.isConnected) {
                                                await openaiRTC.disconnect();
                                                await openaiRTC.connect('shimmer');
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedVoice === 'shimmer'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-background/80'
                                            }`}
                                    >
                                        Femme
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="neu-raised p-2 rounded-lg hover:shadow-neo-md transition-all"
                            >
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>
                    </div>
                </div >

                {/* Tabs & Content */}
                <Tabs defaultValue="ichat" className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 border-b border-border/50 bg-background/50 backdrop-blur-sm">
                        <TabsList className="w-full justify-start bg-transparent h-12 p-0 gap-6">
                            <TabsTrigger value="ichat" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full gap-2 transition-all">
                                <MessageSquare className="w-4 h-4" /> iChat
                            </TabsTrigger>
                            <TabsTrigger value="call" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full gap-2 transition-all">
                                <Phone className="w-4 h-4" /> iAppel
                            </TabsTrigger>
                            <TabsTrigger value="meeting" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full gap-2 transition-all">
                                <Users className="w-4 h-4" /> iRéunion
                            </TabsTrigger>
                            <TabsTrigger value="contact" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full gap-2 transition-all">
                                <UserCircle className="w-4 h-4" /> iContact
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden relative bg-background">
                        <TabsContent value="ichat" className="h-full m-0 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                <AnimatePresence>
                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                            onDelete={handleDeleteMessage}
                                            onEdit={handleEditMessage}
                                            onCopy={handleCopyMessage}
                                            onSaveToDocuments={handleSaveToDocuments}
                                            onSendByMail={handleSendByMail}
                                            onSendByCorrespondance={handleSendByCorrespondance}
                                            userRole={userRole}
                                        />
                                    ))}
                                </AnimatePresence>
                                {isProcessing && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-2 px-4 py-3 text-muted-foreground"
                                    >
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">iAsted réfléchit...</span>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t neu-card rounded-b-2xl">
                                <div className="flex items-end gap-3">
                                    {/* Microphone Button */}
                                    <button
                                        onClick={() => openaiRTC.toggleConversation(selectedVoice)}
                                        className={`shrink-0 neu-raised w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${openaiRTC.isConnected
                                            ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-primary/30 animate-pulse'
                                            : 'hover:shadow-neo-md'
                                            }`}
                                        title={openaiRTC.isConnected ? 'Désactiver le microphone' : 'Activer le microphone'}
                                    >
                                        {openaiRTC.isConnected ? (
                                            <MicOff className="w-6 h-6 text-white" />
                                        ) : (
                                            <Mic className="w-6 h-6 text-primary" />
                                        )}
                                    </button>

                                    <div className="flex-1 relative">
                                        <textarea
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            placeholder={
                                                openaiRTC.isConnected ? `🎙️ Mode vocal actif` :
                                                    hasIAsted ? "Posez votre question à iChat..." : "Envoyer un message..."
                                            }
                                            className="w-full neu-inset rounded-xl p-4 pr-12 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px] max-h-[120px]"
                                            rows={1}
                                            disabled={isProcessing || openaiRTC.isConnected}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!inputText.trim() || isProcessing || openaiRTC.isConnected}
                                            className="absolute right-2 bottom-2 p-2 rounded-lg hover:bg-primary/10 text-primary disabled:opacity-50 transition-colors"
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="p-2 border-t border-border/30 flex items-center justify-center text-muted-foreground text-xs gap-2"
                            >
                                <MessageSquare className="w-3 h-3 text-primary" />
                                {hasIAsted ?
                                    '💬 Conversation stratégique' :
                                    '💬 Conversation'}
                            </div>
                        </TabsContent>

                        <TabsContent value="call" className="absolute inset-0 m-0 overflow-hidden data-[state=active]:block data-[state=inactive]:hidden">
                            <IAppelPanel />
                        </TabsContent>

                        <TabsContent value="meeting" className="absolute inset-0 m-0 overflow-hidden data-[state=active]:block data-[state=inactive]:hidden">
                            <IReunionPanel />
                        </TabsContent>

                        <TabsContent value="contact" className="absolute inset-0 m-0 overflow-hidden data-[state=active]:block data-[state=inactive]:hidden">
                            <IContactPanel
                                onStartChat={(userId, displayName) => {
                                    toast({
                                        title: "iChat",
                                        description: `Démarrage de la conversation avec ${displayName}`,
                                    });
                                }}
                                onStartCall={(userId, displayName) => {
                                    toast({
                                        title: "iAppel",
                                        description: `Appel vers ${displayName}`,
                                    });
                                }}
                                onStartVideo={(userId, displayName) => {
                                    toast({
                                        title: "iVidéo",
                                        description: `Appel vidéo vers ${displayName}`,
                                    });
                                }}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </motion.div>
        </div >
    );
};
