import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Paperclip, Clock, Building2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CorrespondanceItem {
    id: string;
    subject: string;
    sender: {
        name: string;
        organization: string;
    };
    date: string;
    comment: string;
    attachmentsCount: number;
    documentType: 'lettre' | 'rapport' | 'note' | 'dossier' | 'decret';
    isRead: boolean;
    isUrgent?: boolean;
}

interface CorrespondanceListProps {
    items: CorrespondanceItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

// Mock data for correspondance
export const MOCK_CORRESPONDANCE: CorrespondanceItem[] = [
    {
        id: 'corr-1',
        subject: 'Permis de construire - Lot 234 Zone Industrielle',
        sender: { name: 'M. Ndong', organization: 'Mairie de Port-Gentil' },
        date: '2024-12-07',
        comment: 'Suite à notre entretien téléphonique, veuillez trouver ci-joint le dossier complet...',
        attachmentsCount: 3,
        documentType: 'dossier',
        isRead: false,
        isUrgent: true,
    },
    {
        id: 'corr-2',
        subject: 'Délibération n°2024-456 - Budget Annexe',
        sender: { name: 'Secrétariat Général', organization: 'Préfecture de l\'Estuaire' },
        date: '2024-12-06',
        comment: 'Pour validation et signature avant le conseil municipal du 15 décembre.',
        attachmentsCount: 5,
        documentType: 'decret',
        isRead: false,
    },
    {
        id: 'corr-3',
        subject: 'Rapport d\'activité - Service État Civil Q4',
        sender: { name: 'Chef de Service', organization: 'État Civil - Libreville' },
        date: '2024-12-05',
        comment: 'Rapport trimestriel des activités du service état civil.',
        attachmentsCount: 2,
        documentType: 'rapport',
        isRead: true,
    },
    {
        id: 'corr-4',
        subject: 'Note de service - Horaires exceptionnels fêtes',
        sender: { name: 'DRH', organization: 'Mairie de Libreville' },
        date: '2024-12-04',
        comment: 'Dispositions particulières pour la période des fêtes de fin d\'année.',
        attachmentsCount: 1,
        documentType: 'note',
        isRead: true,
    },
];

const DOC_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    lettre: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Lettre' },
    rapport: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Rapport' },
    note: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'Note' },
    dossier: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Dossier' },
    decret: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Décret' },
};

export function CorrespondanceList({ items, selectedId, onSelect }: CorrespondanceListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-10">
                    <FileText className="w-12 h-12 opacity-30" />
                    <p className="text-sm">Aucune correspondance</p>
                </div>
            ) : (
                items.map((item) => {
                    const docStyle = DOC_TYPE_STYLES[item.documentType] || DOC_TYPE_STYLES.lettre;

                    return (
                        <Card
                            key={item.id}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-md border-l-4",
                                selectedId === item.id
                                    ? "border-l-primary bg-primary/5 shadow-md"
                                    : "border-l-transparent hover:border-l-primary/50",
                                !item.isRead && "bg-accent/5"
                            )}
                            onClick={() => onSelect(item.id)}
                        >
                            <CardContent className="p-3">
                                <div className="flex gap-3">
                                    {/* A4 Miniature Preview */}
                                    <div className={cn(
                                        "w-16 h-20 rounded-md border-2 border-dashed flex flex-col items-center justify-center shrink-0 relative overflow-hidden",
                                        docStyle.bg, "border-current", docStyle.text
                                    )}>
                                        <FileText className="w-6 h-6 opacity-60" />
                                        <span className="text-[8px] font-bold mt-1 uppercase">{docStyle.label}</span>

                                        {/* PDF-like lines */}
                                        <div className="absolute inset-x-2 top-2 space-y-0.5 opacity-20">
                                            <div className="h-0.5 bg-current rounded" />
                                            <div className="h-0.5 bg-current rounded w-3/4" />
                                            <div className="h-0.5 bg-current rounded w-1/2" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className={cn(
                                                "text-sm line-clamp-2 leading-tight",
                                                !item.isRead ? "font-bold" : "font-medium"
                                            )}>
                                                {item.subject}
                                            </h4>
                                            {item.isUrgent && (
                                                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 shrink-0">
                                                    URGENT
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                            <Building2 className="w-3 h-3" />
                                            <span className="truncate">{item.sender.organization}</span>
                                        </div>

                                        {/* Comment */}
                                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded p-1.5 mb-2">
                                            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                            <p className="line-clamp-2 italic">"{item.comment}"</p>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(item.date).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </span>
                                                {item.attachmentsCount > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Paperclip className="w-3 h-3" />
                                                        {item.attachmentsCount} pièce{item.attachmentsCount > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <Badge variant="outline" className={cn("text-[9px] px-1.5", docStyle.text)}>
                                                {docStyle.label}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
    );
}
