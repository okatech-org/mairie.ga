import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Mail,
    FileText,
    MessageSquare,
    Phone,
    Video,
    Users,
    ChevronDown,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { iBoiteService } from "@/services/iboite-service";
import { correspondanceService } from "@/services/correspondanceService";
import { useToast } from "@/hooks/use-toast";

export function FunctionReminder() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [iboiteUnread, setIboiteUnread] = useState(0);
    const [correspondanceUnread, setCorrespondanceUnread] = useState(0);
    const [icomUnread, setIcomUnread] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [iboiteCount, correspondenceCount] = await Promise.all([
                    iBoiteService.getUnreadCount(),
                    correspondanceService.getUnreadCount()
                ]);

                setIboiteUnread(iboiteCount);
                setCorrespondanceUnread(correspondenceCount);

                // Aggregated count for iCom (iChat notifications)
                // In a real app, iCom would have its own notification stream
                setIcomUnread(iboiteCount > 0 ? 1 : 0);
            } catch (error) {
                console.error("Failed to fetch notification counts", error);
            }
        };

        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const openIAsted = () => {
        window.dispatchEvent(new CustomEvent('iasted-open-chat'));
    };

    const startCall = (video = false) => {
        toast({
            title: video ? "Appel Vidéo" : "Appel Audio",
            description: "Initialisation de la communication...",
        });
        // This would trigger the iCom systems
    };

    return (
        <Card className="neu-raised animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Rappel des fonctions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* iBoîte */}
                    <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2 relative neu-raised hover:bg-primary/5 border-primary/20"
                        onClick={() => navigate('/iboite')}
                    >
                        <Mail className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-semibold">iBoîte</span>
                        {iboiteUnread > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 animate-pulse">
                                {iboiteUnread}
                            </Badge>
                        )}
                    </Button>

                    {/* iCorrespondance */}
                    <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2 relative neu-raised hover:bg-primary/5 border-primary/20"
                        onClick={() => navigate('/icorrespondance')}
                    >
                        <FileText className="w-6 h-6 text-green-500" />
                        <span className="text-xs font-semibold">iCorrespondance</span>
                        {correspondanceUnread > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-orange-500 hover:bg-orange-600">
                                {correspondanceUnread}
                            </Badge>
                        )}
                    </Button>

                    {/* iCom Group */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-20 flex flex-col gap-2 relative neu-raised hover:bg-primary/5 border-primary/20"
                            >
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="w-6 h-6 text-purple-500" />
                                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                </div>
                                <span className="text-xs font-semibold">iCom</span>
                                {icomUnread > 0 && (
                                    <Badge className="absolute -top-2 -right-2 bg-purple-500 hover:bg-purple-600">
                                        {icomUnread}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] p-2 neu-card">
                            <DropdownMenuItem
                                className="flex items-center gap-3 cursor-pointer p-3 hover:bg-primary/10 rounded-lg"
                                onClick={openIAsted}
                            >
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">iChat</span>
                                    <span className="text-[10px] text-muted-foreground">Assistant iAsted</span>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="flex items-center gap-3 cursor-pointer p-3 hover:bg-primary/10 rounded-lg"
                                onClick={() => startCall(false)}
                            >
                                <Phone className="w-4 h-4 text-blue-500" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">iAppel</span>
                                    <span className="text-[10px] text-muted-foreground">Audio & Vidéo</span>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="flex items-center gap-3 cursor-pointer p-3 hover:bg-primary/10 rounded-lg"
                                onClick={() => navigate('/dashboard/citizen/requests?tab=meetings')}
                            >
                                <Users className="w-4 h-4 text-green-500" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">iRéunion</span>
                                    <span className="text-[10px] text-muted-foreground">Vidéoconférence</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}
