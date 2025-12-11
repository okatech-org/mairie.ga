import { useMunicipality, DetectionSource } from '@/contexts/MunicipalityContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MapPin,
    Building2,
    Navigation,
    ChevronDown,
    RefreshCw,
    User,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MunicipalityIndicatorProps {
    variant?: 'compact' | 'full';
    className?: string;
}

const sourceLabels: Record<DetectionSource, { label: string; icon: typeof MapPin }> = {
    geolocation: { label: 'Basé sur votre position', icon: Navigation },
    user_profile: { label: 'Votre commune d\'inscription', icon: User },
    manual: { label: 'Sélection manuelle', icon: Globe },
    default: { label: 'Par défaut', icon: Building2 },
};

export function MunicipalityIndicator({ variant = 'compact', className }: MunicipalityIndicatorProps) {
    const {
        currentMunicipality,
        detectionSource,
        isLoading,
        distanceToMunicipality,
        availableMunicipalities,
        changeMunicipality,
        refreshLocation,
        clearManualSelection,
    } = useMunicipality();

    if (isLoading) {
        return (
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted animate-pulse", className)}>
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Détection...</span>
            </div>
        );
    }

    if (!currentMunicipality) {
        return null;
    }

    const sourceInfo = sourceLabels[detectionSource];
    const SourceIcon = sourceInfo.icon;

    if (variant === 'compact') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn("gap-2 h-8 px-3", className)}
                    >
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span className="max-w-[120px] truncate text-xs font-medium">
                            {currentMunicipality.city || currentMunicipality.name.replace('Mairie de ', '')}
                        </span>
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {currentMunicipality.name}
                    </DropdownMenuLabel>
                    <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
                        <SourceIcon className="h-3 w-3" />
                        {sourceInfo.label}
                        {distanceToMunicipality !== null && detectionSource === 'geolocation' && (
                            <span className="ml-1">• {distanceToMunicipality} km</span>
                        )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Changer de commune
                    </DropdownMenuLabel>
                    <div className="max-h-48 overflow-y-auto">
                        {availableMunicipalities.slice(0, 15).map((org) => (
                            <DropdownMenuItem
                                key={org.id}
                                onClick={() => changeMunicipality(org.id)}
                                className={cn(
                                    "cursor-pointer",
                                    org.id === currentMunicipality.id && "bg-primary/10"
                                )}
                            >
                                <MapPin className="h-3 w-3 mr-2 text-muted-foreground" />
                                <span className="truncate">{org.city || org.name.replace('Mairie de ', '')}</span>
                                {org.province && (
                                    <Badge variant="outline" className="ml-auto text-[10px] px-1">
                                        {org.province.substring(0, 3)}
                                    </Badge>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => refreshLocation()} className="cursor-pointer">
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Actualiser ma position
                    </DropdownMenuItem>
                    {detectionSource === 'manual' && (
                        <DropdownMenuItem onClick={() => clearManualSelection()} className="cursor-pointer text-muted-foreground">
                            Réinitialiser
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // Variant full
    return (
        <div className={cn(
            "flex items-center justify-between gap-3 p-3 rounded-xl bg-card border",
            className
        )}>
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="font-medium text-sm">{currentMunicipality.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <SourceIcon className="h-3 w-3" />
                        {sourceInfo.label}
                        {distanceToMunicipality !== null && (
                            <span className="ml-1">• {distanceToMunicipality} km</span>
                        )}
                    </p>
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        Changer
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Sélectionner une commune</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-64 overflow-y-auto">
                        {availableMunicipalities.map((org) => (
                            <DropdownMenuItem
                                key={org.id}
                                onClick={() => changeMunicipality(org.id)}
                                className={cn(
                                    "cursor-pointer",
                                    org.id === currentMunicipality.id && "bg-primary/10"
                                )}
                            >
                                {org.city || org.name}
                                {org.province && (
                                    <Badge variant="outline" className="ml-auto text-[10px]">
                                        {org.province}
                                    </Badge>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
