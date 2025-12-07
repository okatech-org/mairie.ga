import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

// Composant Label avec indicateur iAsted
interface IAstedLabelProps {
    children: React.ReactNode;
    filledByIasted?: boolean;
    className?: string;
    variant?: 'primary' | 'blue';
}

export function IAstedLabel({ children, filledByIasted, className, variant = 'primary' }: IAstedLabelProps) {
    const colorClass = variant === 'blue' ? 'bg-blue-500/10' : 'bg-primary/10';
    const iconColorClass = variant === 'blue' ? 'text-blue-500' : 'text-primary';
    
    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <Label>{children}</Label>
            {filledByIasted && (
                <span className={cn(
                    "inline-flex items-center justify-center w-4 h-4 rounded-full animate-in fade-in zoom-in duration-300",
                    colorClass
                )}>
                    <Mic className={cn("w-2.5 h-2.5", iconColorClass)} />
                </span>
            )}
        </div>
    );
}

// Composant Input avec indicateur visuel iAsted et support erreur
interface IAstedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    filledByIasted?: boolean;
    variant?: 'primary' | 'blue';
    hasError?: boolean;
    errorMessage?: string;
}

export function IAstedInput({ filledByIasted, className, variant = 'primary', hasError, errorMessage, ...props }: IAstedInputProps) {
    const borderClass = variant === 'blue' ? 'border-blue-500/30 bg-blue-500/5' : 'border-primary/30 bg-primary/5';
    const iconBgClass = variant === 'blue' ? 'bg-blue-500/20' : 'bg-primary/20';
    const iconColorClass = variant === 'blue' ? 'text-blue-500' : 'text-primary';
    const errorClass = hasError ? 'border-destructive bg-destructive/5 focus-visible:ring-destructive/30' : '';
    
    return (
        <div className="relative">
            <Input 
                className={cn(
                    filledByIasted && !hasError && `pr-8 ${borderClass} transition-colors duration-300`,
                    errorClass,
                    className
                )} 
                {...props} 
            />
            {filledByIasted && !hasError && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", iconBgClass)}>
                        <Mic className={cn("w-3 h-3", iconColorClass)} />
                    </div>
                </div>
            )}
            {hasError && errorMessage && (
                <p className="text-xs text-destructive mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}

// Indicateur pour les Select
interface IAstedSelectIndicatorProps {
    filledByIasted?: boolean;
    variant?: 'primary' | 'blue';
}

export function IAstedSelectIndicator({ filledByIasted, variant = 'primary' }: IAstedSelectIndicatorProps) {
    if (!filledByIasted) return null;
    
    const iconColorClass = variant === 'blue' ? 'text-blue-500' : 'text-primary';
    
    return <Mic className={cn("w-3 h-3 ml-auto", iconColorClass)} />;
}

// Classes utilitaires pour les Select
export function getIAstedSelectClasses(filledByIasted: boolean, variant: 'primary' | 'blue' = 'primary', hasError: boolean = false): string {
    if (hasError) return 'border-destructive bg-destructive/5';
    if (!filledByIasted) return '';
    return variant === 'blue' ? 'border-blue-500/30 bg-blue-500/5' : 'border-primary/30 bg-primary/5';
}
