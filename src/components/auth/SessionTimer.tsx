import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useSessionConfigStore } from "@/stores/sessionConfigStore";
import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SessionTimer() {
    const { user } = useAuth();
    const { inactivityTimeout } = useSessionConfigStore();
    const { getLastActivity } = useInactivityLogout();

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [percentage, setPercentage] = useState<number>(100);

    useEffect(() => {
        if (!user || inactivityTimeout === 0) return;

        const timeoutMs = inactivityTimeout * 60 * 1000;

        const updateTimer = () => {
            const lastActivity = getLastActivity();
            const now = Date.now();
            const elapsed = now - lastActivity;
            const remaining = Math.max(0, timeoutMs - elapsed);

            setTimeLeft(remaining);
            setPercentage((remaining / timeoutMs) * 100);
        };

        updateTimer(); // Initial update
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [user, inactivityTimeout, getLastActivity]); // getLastActivity is stable

    if (!user || inactivityTimeout === 0) return null;

    // Format time remaining
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    // Color based on urgency
    let colorClass = "bg-primary";
    if (percentage < 20) colorClass = "bg-destructive";
    else if (percentage < 50) colorClass = "bg-yellow-500";

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border cursor-help transition-colors hover:bg-muted/50 w-[140px]">
                        <Clock className={`w-3.5 h-3.5 ${percentage < 20 ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <div className="flex flex-col gap-0.5 flex-1 w-full">
                            <span className={`text-[10px] font-medium leading-none ${percentage < 20 ? 'text-destructive font-bold' : 'text-foreground'}`}>
                                {minutes}:{seconds.toString().padStart(2, '0')}
                            </span>
                            <Progress value={percentage} className={`h-1 [&>div]:${colorClass}`} />
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Temps avant déconnexion automatique</p>
                    <p className="text-xs text-muted-foreground">Bougez la souris pour réinitialiser</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
