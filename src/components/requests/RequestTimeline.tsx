import { motion } from 'framer-motion';
import { 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Send,
  Eye,
  UserCheck,
  FileCheck
} from 'lucide-react';
import { RequestStatus } from '@/types/request';
import { cn } from '@/lib/utils';

interface TimelineStep {
  status: RequestStatus;
  label: string;
  description: string;
  icon: typeof Clock;
  date?: string;
}

const STATUS_STEPS: TimelineStep[] = [
  { 
    status: RequestStatus.PENDING, 
    label: 'Demande soumise', 
    description: 'Votre demande a été reçue',
    icon: Send
  },
  { 
    status: RequestStatus.IN_PROGRESS, 
    label: 'En cours de traitement', 
    description: 'Un agent examine votre dossier',
    icon: Eye
  },
  { 
    status: RequestStatus.AWAITING_DOCUMENTS, 
    label: 'Documents complémentaires', 
    description: 'Pièces supplémentaires requises',
    icon: FileText
  },
  { 
    status: RequestStatus.VALIDATED, 
    label: 'Dossier validé', 
    description: 'Votre dossier est complet',
    icon: UserCheck
  },
  { 
    status: RequestStatus.COMPLETED, 
    label: 'Terminé', 
    description: 'Votre document est prêt',
    icon: FileCheck
  },
];

interface RequestTimelineProps {
  currentStatus: RequestStatus;
  createdAt: string;
  updatedAt: string;
  isRejected?: boolean;
  rejectionReason?: string;
}

export const RequestTimeline = ({ 
  currentStatus, 
  createdAt,
  updatedAt,
  isRejected,
  rejectionReason
}: RequestTimelineProps) => {
  const getCurrentStepIndex = () => {
    if (isRejected) return -1;
    return STATUS_STEPS.findIndex(step => step.status === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isRejected) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-destructive/20">
            <XCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">Demande rejetée</p>
            <p className="text-sm text-muted-foreground mt-1">
              {rejectionReason || 'Votre demande n\'a pas pu être traitée.'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Rejeté le {formatDate(updatedAt)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Créé le {formatDate(createdAt)}</span>
      </div>

      <div className="relative">
        {STATUS_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 pb-6 last:pb-0"
            >
              {/* Line connector */}
              {index < STATUS_STEPS.length - 1 && (
                <div 
                  className={cn(
                    "absolute w-0.5 h-[calc(100%-3rem)] ml-[1.1rem] mt-10",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                  style={{ top: `${index * 6}rem` }}
                />
              )}

              {/* Icon */}
              <div 
                className={cn(
                  "relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isPending && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div className={cn(
                "flex-1 pt-1",
                isPending && "opacity-50"
              )}>
                <p className={cn(
                  "font-medium",
                  isCurrent && "text-primary"
                )}>
                  {step.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Mis à jour le {formatDate(updatedAt)}
                  </p>
                )}
              </div>

              {/* Status indicator */}
              {isCurrent && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex-shrink-0"
                >
                  <AlertCircle className="h-5 w-5 text-primary" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
