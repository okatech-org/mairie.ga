/**
 * WorkflowTimeline Component
 * Displays the workflow history of an iCorrespondance folder
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Send, CheckCircle, XCircle, RotateCcw,
    Printer, MessageSquare, Clock, User, Eye, Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { correspondanceService, WorkflowStep } from '@/services/correspondanceService';

interface WorkflowTimelineProps {
    folderId: string;
    className?: string;
}

const STEP_CONFIG: Record<string, {
    icon: typeof FileText;
    label: string;
    color: string;
    bgColor: string;
}> = {
    CREATED: {
        icon: FileText,
        label: 'Dossier créé',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    SENT_FOR_APPROVAL: {
        icon: Send,
        label: 'Envoyé pour approbation',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
    },
    VIEWED: {
        icon: Eye,
        label: 'Consulté',
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
    },
    APPROVED: {
        icon: CheckCircle,
        label: 'Approuvé',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
    },
    REJECTED: {
        icon: XCircle,
        label: 'Rejeté',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    MODIFICATION_REQUESTED: {
        icon: RotateCcw,
        label: 'Modification demandée',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
    RETURNED_TO_AGENT: {
        icon: RotateCcw,
        label: 'Retourné à l\'agent',
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
    },
    READY_FOR_DELIVERY: {
        icon: Clock,
        label: 'Prêt pour remise',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    DELIVERED_PRINT: {
        icon: Printer,
        label: 'Remis (impression)',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
    },
    DELIVERED_IBOITE: {
        icon: MessageSquare,
        label: 'Envoyé via iBoîte',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
    },
    ARCHIVED: {
        icon: Archive,
        label: 'Archivé',
        color: 'text-slate-500',
        bgColor: 'bg-slate-500/10',
    },
};

export function WorkflowTimeline({ folderId, className }: WorkflowTimelineProps) {
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [folderId]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const history = await correspondanceService.getWorkflowHistory(folderId);
            setSteps(history);
        } catch (error) {
            console.error('Error loading workflow history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTimeDiff = (current: string, previous?: string) => {
        if (!previous) return null;
        const diff = new Date(current).getTime() - new Date(previous).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}j`;
        if (hours > 0) return `${hours}h`;
        return '< 1h';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
        );
    }

    if (steps.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-4">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun historique disponible</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-0", className)}>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Parcours du dossier
            </h4>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />

                <AnimatePresence>
                    {steps.map((step, index) => {
                        const config = STEP_CONFIG[step.step_type] || {
                            icon: FileText,
                            label: step.step_type,
                            color: 'text-gray-500',
                            bgColor: 'bg-gray-500/10',
                        };
                        const Icon = config.icon;
                        const timeDiff = index > 0 ? getTimeDiff(step.created_at, steps[index - 1].created_at) : null;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative pl-10 pb-4"
                            >
                                {/* Icon circle */}
                                <div className={cn(
                                    "absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center",
                                    config.bgColor,
                                    index === steps.length - 1 && "ring-2 ring-primary"
                                )}>
                                    <Icon className={cn("h-4 w-4", config.color)} />
                                </div>

                                {/* Time indicator */}
                                {timeDiff && (
                                    <div className="absolute -left-8 top-1 text-xs text-muted-foreground">
                                        +{timeDiff}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="bg-card rounded-lg border p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className={cn("font-medium text-sm", config.color)}>
                                                {config.label}
                                            </p>
                                            {step.actor_name && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <User className="h-3 w-3" />
                                                    {step.actor_name}
                                                    {step.actor_role && (
                                                        <span className="text-muted-foreground/60">
                                                            ({step.actor_role})
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                            {step.target_name && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    → {step.target_name}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDate(step.created_at)}
                                        </span>
                                    </div>
                                    {step.comment && (
                                        <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-border pl-2">
                                            "{step.comment}"
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default WorkflowTimeline;
