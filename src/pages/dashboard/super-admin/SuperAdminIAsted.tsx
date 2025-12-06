import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Save, Play, RefreshCw, MessageSquare, Settings2, Database, BrainCircuit } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

export default function SuperAdminIAsted() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Config State
    const [config, setConfig] = useState({
        modelName: "gpt-4o",
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: "Tu es iAsted, l'assistant virtuel officiel...",
        enableSearch: true,
        enableKnowledgeBase: true
    });

    // Chat State
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Bonjour, je suis iAsted configuré avec vos nouveaux paramètres. Comment puis-je vous aider ?' }
    ]);

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        toast({
            title: "Configuration enregistrée",
            description: "Les paramètres de iAsted ont été mis à jour avec succès.",
        });
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;

        const newMessages = [...messages, { role: 'user' as const, content: chatInput }];
        setMessages(newMessages);
        setChatInput("");

        // Simulate response
        setTimeout(() => {
            setMessages([...newMessages, {
                role: 'assistant',
                content: `Réponse simulée avec température ${config.temperature} et le modèle ${config.modelName}.`
            }]);
        }, 1000);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Gestion iAsted</h1>
                        <p className="text-muted-foreground">Configuration de l'intelligence artificielle et du comportement</p>
                    </div>
                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Enregistrer
                    </Button>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Configuration Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="neu-raised">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BrainCircuit className="w-5 h-5 text-purple-600" />
                                    Paramètres du Modèle
                                </CardTitle>
                                <CardDescription>Ajustez les paramètres techniques du LLM</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Modèle Principal</Label>
                                        <Input
                                            value={config.modelName}
                                            onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Tokens</Label>
                                        <Input
                                            type="number"
                                            value={config.maxTokens}
                                            onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <Label>Température ({config.temperature})</Label>
                                        <span className="text-xs text-muted-foreground">Plus créatif vs Plus précis</span>
                                    </div>
                                    <Slider
                                        value={[config.temperature]}
                                        max={1}
                                        step={0.1}
                                        onValueChange={(val) => setConfig({ ...config, temperature: val[0] })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Moteur de Recherche</Label>
                                        <p className="text-sm text-muted-foreground">Autoriser iAsted à chercher sur le web</p>
                                    </div>
                                    <Switch
                                        checked={config.enableSearch}
                                        onCheckedChange={(c) => setConfig({ ...config, enableSearch: c })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Base de Connaissances RAG</Label>
                                        <p className="text-sm text-muted-foreground">Utiliser les documents internes pour répondre</p>
                                    </div>
                                    <Switch
                                        checked={config.enableKnowledgeBase}
                                        onCheckedChange={(c) => setConfig({ ...config, enableKnowledgeBase: c })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="neu-raised">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings2 className="w-5 h-5 text-blue-600" />
                                    System Prompt
                                </CardTitle>
                                <CardDescription>Définissez la personnalité et les règles strictes de l'assistant</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    className="min-h-[300px] font-mono text-sm"
                                    value={config.systemPrompt}
                                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chat Sandbox Column */}
                    <div className="lg:col-span-1">
                        <Card className="neu-raised h-[calc(100vh-10rem)] flex flex-col sticky top-24">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <Bot className="w-4 h-4" />
                                    Test Sandbox
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden relative">
                                <ScrollArea className="h-full p-4">
                                    <div className="space-y-4">
                                        {messages.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="p-3 border-t bg-background/50 backdrop-blur">
                                <form
                                    className="flex w-full gap-2"
                                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                >
                                    <Input
                                        placeholder="Tester le prompt..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                    />
                                    <Button type="submit" size="icon">
                                        <Play className="w-4 h-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
