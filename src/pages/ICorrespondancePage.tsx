/**
 * iCorrespondance Page
 * 
 * Gestion des dossiers de correspondance officielle avec:
 * - Persistance en base Supabase
 * - Envoi interne via iBoîte (collaborateurs)
 * - Envoi externe via email (correspondanceService)
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { MailSidebar } from '@/components/mail/MailSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { iBoiteService } from '@/services/iboite-service';
import { correspondanceService } from '@/services/correspondanceService';
import {
    FolderOpen, FolderClosed, FileText, ArrowLeft, Search, Plus,
    Clock, Paperclip, Building2, MessageSquare, Download, Eye,
    MoreVertical, Filter, X, Send, CheckCircle, AlertCircle,
    Loader2, Upload, Trash2, Archive, Mail, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { generateDocumentPDF } from '@/services/mockDocumentService';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
    CORRESPONDANCE_TYPES,
    ORGANIZATIONS,
    getOrganizationContacts,
} from '@/data/correspondanceData';
import { IBoiteRecipientSearch } from '@/components/iboite/IBoiteRecipientSearch';

// Storage bucket for iCorrespondance documents
const ICORRESPONDANCE_BUCKET = 'icorrespondance-documents';

// ============================================================
// TYPES
// ============================================================

interface ICorrespondanceFolder {
    id: string;
    user_id?: string;
    organization_id?: string;
    name: string;
    reference_number?: string;
    recipient_name?: string;
    recipient_organization?: string;
    recipient_email?: string;
    recipient_user_id?: string;
    comment?: string;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'ARCHIVED';
    is_urgent: boolean;
    is_read: boolean;
    is_internal: boolean;
    iboite_conversation_id?: string;
    sent_at?: string;
    created_at: string;
    updated_at?: string;
    documents: ICorrespondanceDocument[];
}

interface ICorrespondanceDocument {
    id: string;
    folder_id?: string;
    name: string;
    file_path?: string;
    file_type: 'pdf' | 'doc' | 'image' | 'other';
    file_size?: string;
    file_url?: string;
    is_generated?: boolean;
    generator_type?: string;
    created_at?: string;
    // Runtime properties (not stored in DB)
    url?: string;
    blob?: Blob;
    file?: File; // Temporary file reference before upload
}

interface SendDialogRecipient {
    type: 'USER' | 'SERVICE';
    id: string;
    displayName: string;
    subtitle?: string;
}

type FilterType = 'all' | 'unread' | 'urgent' | 'pending' | 'archived' | 'sent';
type SortType = 'date_desc' | 'date_asc' | 'name' | 'recipient';

const DOC_TYPE_ICON: Record<string, { color: string; label: string }> = {
    pdf: { color: 'text-red-500', label: 'PDF' },
    doc: { color: 'text-blue-500', label: 'DOC' },
    image: { color: 'text-green-500', label: 'IMG' },
    other: { color: 'text-gray-500', label: 'FILE' },
};

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    DRAFT: { label: 'Brouillon', variant: 'outline' },
    PENDING_APPROVAL: { label: 'En attente', variant: 'secondary' },
    APPROVED: { label: 'Approuvé', variant: 'default' },
    SENT: { label: 'Envoyé', variant: 'default' },
    ARCHIVED: { label: 'Archivé', variant: 'secondary' },
};

// ============================================================
// COMPONENT
// ============================================================

export default function ICorrespondancePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    // State
    const [folders, setFolders] = useState<ICorrespondanceFolder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<ICorrespondanceFolder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('date_desc');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<ICorrespondanceDocument | null>(null);
    const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
    const [sendMode, setSendMode] = useState<'internal' | 'external' | null>(null);

    // New folder form
    const [newFolderData, setNewFolderData] = useState({
        name: '',
        recipientOrg: '',
        recipientName: '',
        recipientEmail: '',
        comment: '',
        isUrgent: false,
    });
    const [newFolderDocs, setNewFolderDocs] = useState<ICorrespondanceDocument[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');

    // Send dialog state
    const [sendRecipients, setSendRecipients] = useState<SendDialogRecipient[]>([]);
    const [externalEmail, setExternalEmail] = useState('');
    const [externalName, setExternalName] = useState('');
    const [externalOrg, setExternalOrg] = useState('');

    // Computed options for comboboxes
    const correspondanceTypeOptions: ComboboxOption[] = CORRESPONDANCE_TYPES.map(type => ({
        value: type.name,
        label: type.name,
        category: type.category,
    }));

    const organizationOptions: ComboboxOption[] = ORGANIZATIONS.map(org => ({
        value: org.id,
        label: org.name,
        category: org.category,
        description: org.address,
    }));

    const contactOptions: ComboboxOption[] = useMemo(() => {
        if (!selectedOrgId) return [];
        const contacts = getOrganizationContacts(selectedOrgId);
        return contacts.map(contact => ({
            value: contact.name,
            label: contact.name,
            description: contact.role,
        }));
    }, [selectedOrgId]);

    // ============================================================
    // SUPABASE OPERATIONS
    // ============================================================

    // Load folders from Supabase
    const loadFolders = async () => {
        setIsInitialLoading(true);
        setError(null);

        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) {
                console.log('📂 [iCorrespondance] No session, using demo data');
                setFolders([]);
                return;
            }

            console.log('📂 [iCorrespondance] Loading folders from Supabase...');

            // Load folders
            const { data: foldersData, error: foldersError } = await (supabase.from as any)('icorrespondance_folders')
                .select('*')
                .order('created_at', { ascending: false });

            if (foldersError) {
                console.error('❌ [iCorrespondance] Folders error:', foldersError);
                // Table may not exist yet, use empty array
                setFolders([]);
                return;
            }

            // Load documents for each folder
            const foldersWithDocs: ICorrespondanceFolder[] = await Promise.all(
                (foldersData || []).map(async (folder: any) => {
                    const { data: docsData } = await (supabase.from as any)('icorrespondance_documents')
                        .select('*')
                        .eq('folder_id', folder.id);

                    return {
                        ...folder,
                        documents: (docsData || []).map((doc: any) => ({
                            ...doc,
                            file_type: doc.file_type || 'pdf',
                        })),
                    };
                })
            );

            setFolders(foldersWithDocs);
            console.log('✅ [iCorrespondance] Loaded', foldersWithDocs.length, 'folders');

        } catch (err: any) {
            console.error('❌ [iCorrespondance] Load error:', err);
            setError('Erreur lors du chargement des dossiers');
            setFolders([]);
        } finally {
            setIsInitialLoading(false);
        }
    };

    // Create folder in Supabase
    const createFolder = async (): Promise<ICorrespondanceFolder | null> => {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) {
                throw new Error('Non authentifié');
            }

            const userId = session.session.user.id;

            // Insert folder
            const { data: folder, error: folderError } = await (supabase.from as any)('icorrespondance_folders')
                .insert({
                    user_id: userId,
                    name: newFolderData.name,
                    recipient_name: newFolderData.recipientName || null,
                    recipient_organization: newFolderData.recipientOrg,
                    recipient_email: newFolderData.recipientEmail || null,
                    comment: newFolderData.comment || null,
                    is_urgent: newFolderData.isUrgent,
                    is_read: true,
                    status: 'DRAFT',
                })
                .select()
                .single();

            if (folderError) {
                console.error('❌ [iCorrespondance] Create folder error:', folderError);
                throw new Error(folderError.message);
            }

            // Insert documents with file upload to Supabase Storage
            if (newFolderDocs.length > 0) {
                for (const doc of newFolderDocs) {
                    let filePath: string | null = null;

                    // Upload file to storage if it's a real file
                    if (doc.file) {
                        filePath = await uploadDocumentToStorage(doc.file, folder.id);
                    }

                    const docToInsert = {
                        folder_id: folder.id,
                        name: doc.name,
                        file_type: doc.file_type,
                        file_size: doc.file_size,
                        file_path: filePath, // Store storage path instead of blob URL
                        is_generated: doc.is_generated || false,
                    };

                    const { error: docsError } = await (supabase.from as any)('icorrespondance_documents')
                        .insert(docToInsert);

                    if (docsError) {
                        console.warn('⚠️ [iCorrespondance] Insert doc error:', docsError);
                    }
                }
            }

            return {
                ...folder,
                documents: newFolderDocs,
            };

        } catch (err: any) {
            console.error('❌ [iCorrespondance] Create error:', err);
            throw err;
        }
    };

    // Update folder status
    const updateFolderStatus = async (folderId: string, status: string, extra?: Record<string, any>) => {
        try {
            const { error } = await (supabase.from as any)('icorrespondance_folders')
                .update({ status, ...extra, updated_at: new Date().toISOString() })
                .eq('id', folderId);

            if (error) throw error;

            setFolders(prev => prev.map(f =>
                f.id === folderId ? { ...f, status: status as any, ...extra } : f
            ));

        } catch (err) {
            console.error('❌ [iCorrespondance] Update status error:', err);
            throw err;
        }
    };

    // Delete folder
    const deleteFolder = async (folderId: string) => {
        try {
            const { error } = await (supabase.from as any)('icorrespondance_folders')
                .delete()
                .eq('id', folderId);

            if (error) throw error;

            setFolders(prev => prev.filter(f => f.id !== folderId));

        } catch (err) {
            console.error('❌ [iCorrespondance] Delete error:', err);
            throw err;
        }
    };

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleOrganizationChange = (orgId: string) => {
        setSelectedOrgId(orgId);
        const org = ORGANIZATIONS.find(o => o.id === orgId);
        if (org) {
            setNewFolderData(prev => ({
                ...prev,
                recipientOrg: org.name,
                recipientName: '',
            }));
        } else {
            setNewFolderData(prev => ({
                ...prev,
                recipientOrg: orgId,
                recipientName: '',
            }));
        }
    };

    // Handle document from iAsted navigation
    useEffect(() => {
        const state = location.state as { newCorrespondance?: boolean; document?: any } | null;

        if (state?.newCorrespondance && state?.document) {
            console.log('📨 [iCorrespondance] Document reçu depuis iAsted:', state.document);

            setIsNewFolderOpen(true);
            setNewFolderData(prev => ({
                ...prev,
                name: `Envoi: ${state.document.name}`,
            }));
            setNewFolderDocs([{
                id: `doc-${Date.now()}`,
                name: state.document.name,
                file_type: state.document.type?.includes('pdf') ? 'pdf' :
                    state.document.type?.includes('doc') ? 'doc' : 'other',
                file_size: state.document.size || 'N/A',
                url: state.document.url,
            }]);

            window.history.replaceState({}, document.title);

            toast({
                title: "📎 Document attaché",
                description: `${state.document.name} est prêt à être envoyé`,
            });
        }
    }, [location.state, toast]);

    // Initial load
    useEffect(() => {
        loadFolders();
    }, []);

    // Filtered and sorted folders
    const filteredAndSortedFolders = folders
        .filter(folder => {
            const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (folder.recipient_organization || '').toLowerCase().includes(searchTerm.toLowerCase());

            switch (filter) {
                case 'unread': return matchesSearch && !folder.is_read;
                case 'urgent': return matchesSearch && folder.is_urgent;
                case 'pending': return matchesSearch && folder.status === 'PENDING_APPROVAL';
                case 'archived': return matchesSearch && folder.status === 'ARCHIVED';
                case 'sent': return matchesSearch && folder.status === 'SENT';
                default: return matchesSearch && folder.status !== 'ARCHIVED';
            }
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'date_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'name': return a.name.localeCompare(b.name);
                case 'recipient': return (a.recipient_organization || '').localeCompare(b.recipient_organization || '');
                default: return 0;
            }
        });

    const unreadCount = folders.filter(f => !f.is_read).length;
    const urgentCount = folders.filter(f => f.is_urgent && !f.is_read).length;
    const draftCount = folders.filter(f => f.status === 'DRAFT').length;

    // Select folder
    const handleSelectFolder = async (folder: ICorrespondanceFolder) => {
        setIsLoading(true);
        try {
            if (!folder.is_read) {
                await (supabase.from as any)('icorrespondance_folders')
                    .update({ is_read: true })
                    .eq('id', folder.id);

                setFolders(prev => prev.map(f =>
                    f.id === folder.id ? { ...f, is_read: true } : f
                ));
            }
            setSelectedFolder({ ...folder, is_read: true });
        } catch (err) {
            console.error('Error selecting folder:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // View document - fetch signed URL from Supabase Storage
    const handleViewDocument = async (doc: ICorrespondanceDocument) => {
        setIsGeneratingPDF(true);
        try {
            let previewUrl: string | undefined = doc.url || doc.file_url;

            // If document has a file_path in storage, get a signed URL
            if (doc.file_path && !previewUrl) {
                console.log('📄 [Preview] Fetching signed URL for:', doc.file_path);
                const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                    .from(ICORRESPONDANCE_BUCKET)
                    .createSignedUrl(doc.file_path, 3600); // 1 hour validity

                if (signedUrlError) {
                    console.error('❌ [Preview] Error getting signed URL:', signedUrlError);
                    throw new Error('Impossible de récupérer le document');
                }
                previewUrl = signedUrlData?.signedUrl;
                console.log('✅ [Preview] Got signed URL:', previewUrl ? 'success' : 'failed');
            }
            // If it's a generated document, generate it on the fly
            else if (!previewUrl && doc.generator_type) {
                console.log('📄 [Preview] Generating document...');
                const result = await generateDocumentPDF(doc as any);
                previewUrl = result.url;
            }

            // Create updated document with URL for preview
            const docWithUrl: ICorrespondanceDocument = {
                ...doc,
                url: previewUrl
            };

            setPreviewDocument(docWithUrl);
            setIsPreviewOpen(true);
        } catch (err: any) {
            console.error('❌ [Preview] Error:', err);
            toast({
                title: "Erreur",
                description: err.message || "Impossible de prévisualiser le document",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // Download document
    const handleDownloadDocument = async (doc: ICorrespondanceDocument) => {
        setIsGeneratingPDF(true);
        try {
            const url = doc.url || doc.file_url;
            if (url) {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = doc.name;
                a.click();
                URL.revokeObjectURL(blobUrl);
            }
            toast({
                title: "✅ Téléchargement",
                description: `${doc.name} téléchargé`,
            });
        } catch (err) {
            toast({
                title: "Erreur",
                description: "Échec du téléchargement",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // Create folder
    const handleCreateFolder = async () => {
        if (!newFolderData.name.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez saisir un nom pour le dossier",
                variant: "destructive",
            });
            return;
        }

        if (!newFolderData.recipientOrg.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez saisir le destinataire",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const newFolder = await createFolder();

            if (newFolder) {
                setFolders(prev => [newFolder, ...prev]);
            }

            // Reset form
            setNewFolderData({
                name: '',
                recipientOrg: '',
                recipientName: '',
                recipientEmail: '',
                comment: '',
                isUrgent: false,
            });
            setNewFolderDocs([]);
            setSelectedOrgId('');
            setIsNewFolderOpen(false);

            toast({
                title: "✅ Dossier créé",
                description: `${newFolderData.name} enregistré avec succès`,
            });

        } catch (err: any) {
            toast({
                title: "Erreur",
                description: err.message || "Impossible de créer le dossier",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Open send dialog
    const handleOpenSendDialog = (folder: ICorrespondanceFolder) => {
        setSelectedFolder(folder);
        setExternalEmail(folder.recipient_email || '');
        setExternalName(folder.recipient_name || '');
        setExternalOrg(folder.recipient_organization || '');
        setSendRecipients([]);
        setSendMode(null);
        setIsSendDialogOpen(true);
    };

    // Send correspondence
    const handleSendCorrespondance = async () => {
        if (!selectedFolder) return;

        setIsLoading(true);
        try {
            if (sendMode === 'internal' && sendRecipients.length > 0) {
                // Send via iBoîte
                console.log('📨 [iCorrespondance] Envoi interne via iBoîte...');

                const conversation = await iBoiteService.createConversation({
                    type: 'PRIVATE',
                    subject: selectedFolder.name,
                    participantIds: sendRecipients.map(r => r.id),
                    initialMessage: selectedFolder.comment || `Dossier: ${selectedFolder.name}`,
                });

                if (conversation) {
                    await updateFolderStatus(selectedFolder.id, 'SENT', {
                        is_internal: true,
                        iboite_conversation_id: conversation.id,
                        sent_at: new Date().toISOString(),
                    });

                    toast({
                        title: "📨 Envoyé via iBoîte",
                        description: `Correspondance envoyée à ${sendRecipients.map(r => r.displayName).join(', ')}`,
                    });
                } else {
                    throw new Error('Échec création conversation');
                }

            } else if (sendMode === 'external' && externalEmail) {
                // Send via email
                console.log('📧 [iCorrespondance] Envoi externe par email...');

                await correspondanceService.sendCorrespondance({
                    recipientEmail: externalEmail,
                    recipientName: externalName,
                    recipientOrg: externalOrg,
                    subject: selectedFolder.name,
                    body: selectedFolder.comment || '',
                    isUrgent: selectedFolder.is_urgent,
                });

                await updateFolderStatus(selectedFolder.id, 'SENT', {
                    is_internal: false,
                    recipient_email: externalEmail,
                    sent_at: new Date().toISOString(),
                });

                toast({
                    title: "📧 Envoyé par email",
                    description: `Correspondance envoyée à ${externalEmail}`,
                });
            } else {
                toast({
                    title: "Erreur",
                    description: "Veuillez sélectionner un mode d'envoi et un destinataire",
                    variant: "destructive",
                });
                return;
            }

            setIsSendDialogOpen(false);
            setSelectedFolder(null);

        } catch (err: any) {
            toast({
                title: "Erreur",
                description: err.message || "Échec de l'envoi",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Archive folder
    const handleArchiveFolder = async (folder: ICorrespondanceFolder) => {
        setIsLoading(true);
        try {
            await updateFolderStatus(folder.id, 'ARCHIVED');
            toast({
                title: "📦 Archivé",
                description: `${folder.name} déplacé vers les archives`,
            });
            setSelectedFolder(null);
        } catch (err) {
            toast({
                title: "Erreur",
                description: "Échec de l'archivage",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Delete folder
    const handleDeleteFolder = async (folder: ICorrespondanceFolder) => {
        if (!confirm(`Supprimer "${folder.name}" ?`)) return;

        setIsLoading(true);
        try {
            await deleteFolder(folder.id);
            toast({
                title: "🗑️ Supprimé",
                description: `${folder.name} supprimé`,
            });
            setSelectedFolder(null);
        } catch (err) {
            toast({
                title: "Erreur",
                description: "Échec de la suppression",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // File upload - store file reference for later upload to Supabase Storage
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newDocs: ICorrespondanceDocument[] = Array.from(files).map(file => ({
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            file_type: file.type.includes('pdf') ? 'pdf' :
                file.type.includes('doc') ? 'doc' :
                    file.type.includes('image') ? 'image' : 'other',
            file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            url: URL.createObjectURL(file), // Temporary preview URL
            file: file, // Keep file reference for upload
        }));

        setNewFolderDocs(prev => [...prev, ...newDocs]);
    };

    // Upload file to Supabase Storage
    const uploadDocumentToStorage = async (file: File, folderId: string): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop() || 'bin';
            const timestamp = Date.now();
            const filePath = `${folderId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

            const { error: uploadError } = await supabase.storage
                .from(ICORRESPONDANCE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return null;
            }

            return filePath;
        } catch (err) {
            console.error('Upload error:', err);
            return null;
        }
    };

    const removeDocument = (docId: string) => {
        setNewFolderDocs(prev => prev.filter(d => d.id !== docId));
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden rounded-2xl neu-card border-none shadow-inner bg-muted/30">
                <div className="flex-1 flex min-h-0">

                    {/* Sidebar */}
                    <div className="hidden md:flex w-48 flex-col border-r bg-background/30 p-3 gap-3">
                        <Button
                            className="w-full gap-2 neu-raised hover:translate-y-[-2px] transition-transform text-primary font-bold text-sm"
                            onClick={() => setIsNewFolderOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="truncate">Nouveau</span>
                        </Button>

                        <div className="space-y-1">
                            {[
                                { id: 'all', label: 'Tous', count: folders.filter(f => f.status !== 'ARCHIVED').length },
                                { id: 'draft', label: 'Brouillons', count: draftCount },
                                { id: 'sent', label: 'Envoyés', count: folders.filter(f => f.status === 'SENT').length },
                                { id: 'urgent', label: 'Urgents', count: urgentCount },
                                { id: 'archived', label: 'Archivés', count: folders.filter(f => f.status === 'ARCHIVED').length },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setFilter(item.id as FilterType)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                                        filter === item.id
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <span>{item.label}</span>
                                    {item.count > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            {item.count}
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm shrink-0">
                            <div className="flex items-center gap-3">
                                {selectedFolder ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedFolder(null)}
                                        className="gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Retour
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center">
                                            <FolderOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h1 className="text-lg font-bold">iCorrespondance</h1>
                                            <p className="text-xs text-muted-foreground">
                                                {folders.length} dossier{folders.length > 1 ? 's' : ''} •
                                                {draftCount > 0 && <span className="text-amber-500 font-medium"> {draftCount} brouillon{draftCount > 1 ? 's' : ''}</span>}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-9 w-48 bg-background/50"
                                    />
                                </div>

                                <Button
                                    className="gap-2 neu-raised md:hidden"
                                    onClick={() => setIsNewFolderOpen(true)}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{error}</span>
                                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setError(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isInitialLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    {selectedFolder ? (
                                        // Folder Detail View
                                        <motion.div
                                            key="folder-detail"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            {/* Folder Header */}
                                            <Card className="neu-card border-l-4 border-l-primary">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h2 className="text-lg font-bold mb-1">{selectedFolder.name}</h2>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Building2 className="w-4 h-4" />
                                                                <span>{selectedFolder.recipient_organization || 'Non spécifié'}</span>
                                                                <span>•</span>
                                                                <Clock className="w-4 h-4" />
                                                                <span>{new Date(selectedFolder.created_at).toLocaleDateString('fr-FR')}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {selectedFolder.is_urgent && (
                                                                <Badge variant="destructive">URGENT</Badge>
                                                            )}
                                                            <Badge variant={STATUS_LABELS[selectedFolder.status]?.variant || 'outline'}>
                                                                {STATUS_LABELS[selectedFolder.status]?.label || selectedFolder.status}
                                                            </Badge>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    {selectedFolder.status === 'DRAFT' && (
                                                                        <DropdownMenuItem onClick={() => handleOpenSendDialog(selectedFolder)}>
                                                                            <Send className="w-4 h-4 mr-2" />
                                                                            Envoyer
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem onClick={() => handleArchiveFolder(selectedFolder)}>
                                                                        <Archive className="w-4 h-4 mr-2" />
                                                                        Archiver
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => handleDeleteFolder(selectedFolder)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Supprimer
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>

                                                    {selectedFolder.comment && (
                                                        <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                                                            <MessageSquare className="w-4 h-4 text-primary mt-0.5" />
                                                            <p className="text-sm italic">"{selectedFolder.comment}"</p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            {/* Documents */}
                                            <div>
                                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                    <Paperclip className="w-4 h-4" />
                                                    {selectedFolder.documents.length} Document{selectedFolder.documents.length > 1 ? 's' : ''}
                                                </h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                    {selectedFolder.documents.map((doc, idx) => {
                                                        const docType = DOC_TYPE_ICON[doc.file_type] || DOC_TYPE_ICON.other;
                                                        return (
                                                            <motion.div
                                                                key={doc.id}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: idx * 0.05 }}
                                                            >
                                                                <Card className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1">
                                                                    <CardContent className="p-0">
                                                                        <div className="aspect-[3/4] bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 relative flex flex-col items-center justify-center border-b">
                                                                            <FileText className={cn("w-10 h-10", docType.color)} />
                                                                            <span className={cn("text-[10px] font-bold mt-1", docType.color)}>
                                                                                {docType.label}
                                                                            </span>
                                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                                <Button
                                                                                    size="icon"
                                                                                    variant="secondary"
                                                                                    className="w-8 h-8"
                                                                                    onClick={() => handleViewDocument(doc)}
                                                                                >
                                                                                    <Eye className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="icon"
                                                                                    variant="secondary"
                                                                                    className="w-8 h-8"
                                                                                    onClick={() => handleDownloadDocument(doc)}
                                                                                >
                                                                                    <Download className="w-4 h-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-2">
                                                                            <p className="text-xs font-medium truncate">{doc.name}</p>
                                                                            <p className="text-[10px] text-muted-foreground">{doc.file_size}</p>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {selectedFolder.status === 'DRAFT' && (
                                                <div className="flex justify-end gap-3 pt-4 border-t">
                                                    <Button variant="outline" onClick={() => handleArchiveFolder(selectedFolder)}>
                                                        <Archive className="w-4 h-4 mr-2" />
                                                        Archiver
                                                    </Button>
                                                    <Button onClick={() => handleOpenSendDialog(selectedFolder)} className="gap-2">
                                                        <Send className="w-4 h-4" />
                                                        Envoyer
                                                    </Button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        // Folders Grid
                                        <motion.div
                                            key="folders-grid"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                        >
                                            {filteredAndSortedFolders.map((folder, idx) => (
                                                <motion.div
                                                    key={folder.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                >
                                                    <Card
                                                        className={cn(
                                                            "cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 group neu-card border-none",
                                                            !folder.is_read && "ring-2 ring-primary/30"
                                                        )}
                                                        onClick={() => handleSelectFolder(folder)}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="relative">
                                                                    <div className={cn(
                                                                        "w-14 h-12 rounded-lg flex items-center justify-center transition-all",
                                                                        "bg-gradient-to-br from-amber-400 to-amber-600",
                                                                        "shadow-lg group-hover:shadow-amber-500/30 group-hover:scale-110"
                                                                    )}>
                                                                        <FolderOpen className="w-7 h-7 text-white" />
                                                                    </div>
                                                                    {!folder.is_read && (
                                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {folder.is_urgent && (
                                                                        <Badge variant="destructive" className="text-[9px] px-1.5">URGENT</Badge>
                                                                    )}
                                                                    <Badge variant={STATUS_LABELS[folder.status]?.variant || 'outline'} className="text-[9px]">
                                                                        {STATUS_LABELS[folder.status]?.label || folder.status}
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            <h3 className={cn(
                                                                "text-sm line-clamp-2 mb-2 leading-tight",
                                                                !folder.is_read ? "font-bold" : "font-medium"
                                                            )}>
                                                                {folder.name}
                                                            </h3>

                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                                                <Building2 className="w-3 h-3" />
                                                                <span className="truncate">{folder.recipient_organization || 'Non spécifié'}</span>
                                                            </div>

                                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
                                                                <span className="flex items-center gap-1">
                                                                    <Paperclip className="w-3 h-3" />
                                                                    {folder.documents.length} doc{folder.documents.length > 1 ? 's' : ''}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(folder.created_at).toLocaleDateString('fr-FR', {
                                                                        day: 'numeric',
                                                                        month: 'short'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}

                                            {filteredAndSortedFolders.length === 0 && (
                                                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                                                    <FolderClosed className="w-16 h-16 opacity-20 mb-4" />
                                                    <p className="font-medium">Aucun dossier trouvé</p>
                                                    <p className="text-sm">Créez votre premier dossier de correspondance</p>
                                                    <Button variant="outline" className="mt-4" onClick={() => setIsNewFolderOpen(true)}>
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Nouveau dossier
                                                    </Button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* New Folder Dialog */}
            <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-primary" />
                            Nouvelle Correspondance
                        </DialogTitle>
                        <DialogDescription>
                            Créez un dossier de correspondance officielle
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label className="mb-2 block">Nom du dossier *</Label>
                            <Combobox
                                options={correspondanceTypeOptions}
                                value={newFolderData.name}
                                onValueChange={(value) => setNewFolderData(prev => ({ ...prev, name: value }))}
                                placeholder="Ex: Demande de permis de construire"
                                searchPlaceholder="Rechercher un type..."
                                emptyMessage="Saisissez un nom personnalisé"
                                allowCustom
                                groupByCategory
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-2 block">Organisation destinataire *</Label>
                                <Combobox
                                    options={organizationOptions}
                                    value={selectedOrgId}
                                    onValueChange={handleOrganizationChange}
                                    placeholder="Sélectionner..."
                                    searchPlaceholder="Rechercher..."
                                    emptyMessage="Non trouvé"
                                    allowCustom
                                    groupByCategory
                                />
                            </div>
                            <div>
                                <Label className="mb-2 block">Nom du contact</Label>
                                <Combobox
                                    options={contactOptions}
                                    value={newFolderData.recipientName}
                                    onValueChange={(value) => setNewFolderData(prev => ({ ...prev, recipientName: value }))}
                                    placeholder="Sélectionner..."
                                    searchPlaceholder="Rechercher..."
                                    emptyMessage="Aucun contact"
                                    allowCustom
                                    disabled={!selectedOrgId}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="mb-2 block">Email (optionnel - pour envoi externe)</Label>
                            <Input
                                type="email"
                                placeholder="exemple@domaine.com"
                                value={newFolderData.recipientEmail}
                                onChange={(e) => setNewFolderData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label className="mb-2 block">Commentaire</Label>
                            <Textarea
                                placeholder="Message d'accompagnement..."
                                value={newFolderData.comment}
                                onChange={(e) => setNewFolderData(prev => ({ ...prev, comment: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="urgent"
                                checked={newFolderData.isUrgent}
                                onChange={(e) => setNewFolderData(prev => ({ ...prev, isUrgent: e.target.checked }))}
                                className="rounded"
                            />
                            <label htmlFor="urgent" className="text-sm">Marquer comme urgent</label>
                        </div>

                        {/* Documents */}
                        <div>
                            <Label className="mb-2 block">Documents</Label>
                            {newFolderDocs.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {newFolderDocs.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <FileText className={cn("w-4 h-4", DOC_TYPE_ICON[doc.file_type]?.color)} />
                                                <span className="text-sm truncate">{doc.name}</span>
                                                <span className="text-xs text-muted-foreground">{doc.file_size}</span>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeDocument(doc.id)}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                                <span className="text-xs text-muted-foreground">Ajouter des documents</span>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewFolderOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleCreateFolder}
                            disabled={isLoading || !newFolderData.name.trim() || !newFolderData.recipientOrg.trim()}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Créer le dossier
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Dialog - Choose Internal vs External */}
            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-primary" />
                            Envoyer la correspondance
                        </DialogTitle>
                        <DialogDescription>
                            Choisissez le mode d'envoi
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Mode Selection */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSendMode('internal')}
                                className={cn(
                                    "p-4 rounded-lg border-2 transition-all text-center",
                                    sendMode === 'internal'
                                        ? "border-primary bg-primary/10"
                                        : "border-muted hover:border-primary/50"
                                )}
                            >
                                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <div className="font-medium text-sm">Collaborateur</div>
                                <div className="text-xs text-muted-foreground">Envoi via iBoîte</div>
                            </button>
                            <button
                                onClick={() => setSendMode('external')}
                                className={cn(
                                    "p-4 rounded-lg border-2 transition-all text-center",
                                    sendMode === 'external'
                                        ? "border-primary bg-primary/10"
                                        : "border-muted hover:border-primary/50"
                                )}
                            >
                                <Mail className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                                <div className="font-medium text-sm">Externe</div>
                                <div className="text-xs text-muted-foreground">Envoi par email</div>
                            </button>
                        </div>

                        {/* Internal Recipient Selection */}
                        {sendMode === 'internal' && (
                            <div className="space-y-2">
                                <Label>Destinataire iBoîte</Label>
                                <IBoiteRecipientSearch
                                    onSelect={(recipients) => setSendRecipients(recipients as SendDialogRecipient[])}
                                    selectedRecipients={sendRecipients}
                                    placeholder="Rechercher un collaborateur..."
                                />
                            </div>
                        )}

                        {/* External Email */}
                        {sendMode === 'external' && (
                            <div className="space-y-3">
                                <div>
                                    <Label className="mb-1 block">Email *</Label>
                                    <Input
                                        type="email"
                                        placeholder="exemple@domaine.com"
                                        value={externalEmail}
                                        onChange={(e) => setExternalEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="mb-1 block">Nom</Label>
                                        <Input
                                            placeholder="Nom du destinataire"
                                            value={externalName}
                                            onChange={(e) => setExternalName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-1 block">Organisation</Label>
                                        <Input
                                            placeholder="Organisation"
                                            value={externalOrg}
                                            onChange={(e) => setExternalOrg(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSendCorrespondance}
                            disabled={
                                isLoading ||
                                !sendMode ||
                                (sendMode === 'internal' && sendRecipients.length === 0) ||
                                (sendMode === 'external' && !externalEmail)
                            }
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Envoyer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Document Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {previewDocument?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 min-h-[400px] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {previewDocument?.url ? (
                            previewDocument.file_type === 'pdf' ? (
                                <object
                                    data={previewDocument.url}
                                    type="application/pdf"
                                    className="w-full h-[500px] rounded-lg"
                                >
                                    <iframe
                                        src={`${previewDocument.url}#toolbar=1`}
                                        className="w-full h-[500px] rounded-lg border-0"
                                        title={previewDocument.name}
                                    />
                                </object>
                            ) : previewDocument.file_type === 'image' ? (
                                <img
                                    src={previewDocument.url}
                                    alt={previewDocument.name}
                                    className="max-w-full max-h-[500px] object-contain"
                                />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Prévisualisation non disponible pour ce type de fichier</p>
                                    <Button className="mt-4" onClick={() => previewDocument && handleDownloadDocument(previewDocument)}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Télécharger
                                    </Button>
                                </div>
                            )
                        ) : isGeneratingPDF ? (
                            <div className="text-center text-muted-foreground">
                                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin opacity-50" />
                                <p>Chargement du document...</p>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Document non disponible</p>
                                <p className="text-xs mt-2">Le fichier n'a pas pu être chargé</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Fermer
                        </Button>
                        <Button onClick={() => previewDocument && handleDownloadDocument(previewDocument)}>
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
