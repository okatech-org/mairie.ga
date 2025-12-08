import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Mic,
    MessageSquare,
    FileText,
    Calendar,
    Search,
    Moon,
    Volume2,
    Navigation,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    ArrowLeft,
    Play,
    Settings,
    Phone,
    Video,
    Mail,
    Users,
    Building2,
    Shield,
    Zap,
    Globe,
    Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const GUIDE_SECTIONS = [
    {
        id: "intro",
        title: "Qu'est-ce qu'iAsted ?",
        icon: Sparkles,
        color: "from-violet-500 to-purple-600",
    },
    {
        id: "capabilities",
        title: "Fonctionnalités",
        icon: Zap,
        color: "from-blue-500 to-cyan-600",
    },
    {
        id: "commands",
        title: "Commandes Vocales",
        icon: Mic,
        color: "from-emerald-500 to-teal-600",
    },
    {
        id: "profiles",
        title: "Profils Utilisateurs",
        icon: Users,
        color: "from-orange-500 to-amber-600",
    },
    {
        id: "start",
        title: "Commencer",
        icon: Play,
        color: "from-pink-500 to-rose-600",
    }
];

const CAPABILITIES = [
    { icon: FileText, title: "Démarches", desc: "Actes de naissance, mariage, décès, certificats", color: "text-blue-500" },
    { icon: Calendar, title: "Rendez-vous", desc: "Planifiez vos visites à la mairie", color: "text-green-500" },
    { icon: Search, title: "Suivi", desc: "Suivez l'état de vos demandes en temps réel", color: "text-purple-500" },
    { icon: Navigation, title: "Navigation", desc: "Pilotez l'application par la voix", color: "text-cyan-500" },
    { icon: Moon, title: "Interface", desc: "Mode sombre, paramètres personnalisés", color: "text-indigo-500" },
    { icon: Volume2, title: "Voix", desc: "Choisissez entre voix masculine et féminine", color: "text-pink-500" },
    { icon: Phone, title: "Appels", desc: "Passez des appels audio aux services", color: "text-emerald-500" },
    { icon: Video, title: "Visio", desc: "Conférences vidéo avec les agents", color: "text-red-500" },
    { icon: Mail, title: "Messages", desc: "Envoyez des emails et messages", color: "text-amber-500" },
    { icon: FileText, title: "Documents", desc: "Générez des PDF automatiquement", color: "text-teal-500" },
    { icon: Globe, title: "Multilingue", desc: "Français et langues locales", color: "text-violet-500" },
    { icon: Shield, title: "Sécurisé", desc: "Vos données sont protégées", color: "text-slate-500" },
];

const VOICE_EXAMPLES = [
    { phrase: "Je veux un acte de naissance", action: "Ouvre le formulaire de demande", category: "Démarches" },
    { phrase: "Prendre rendez-vous à la mairie", action: "Affiche le calendrier de réservation", category: "RDV" },
    { phrase: "Montre mes demandes en cours", action: "Navigue vers la liste des demandes", category: "Suivi" },
    { phrase: "Passe en mode sombre", action: "Change le thème de l'interface", category: "Interface" },
    { phrase: "Appelle le service urbanisme", action: "Lance un appel vers le service", category: "Communication" },
    { phrase: "Lis mon dernier mail", action: "Lit le contenu de l'email à haute voix", category: "Messages" },
    { phrase: "Génère un certificat de résidence", action: "Crée un PDF téléchargeable", category: "Documents" },
    { phrase: "Arrête-toi", action: "Termine la conversation vocale", category: "Contrôle" },
];

const USER_PROFILES = [
    {
        role: "Citoyen",
        description: "iAsted vous accompagne dans vos démarches administratives : actes d'état civil, demandes d'urbanisme, fiscalité locale.",
        icon: Users,
        color: "bg-blue-500"
    },
    {
        role: "Agent Municipal",
        description: "iAsted vous assiste dans vos tâches quotidiennes : traitement des dossiers, rendez-vous, accueil du public.",
        icon: Building2,
        color: "bg-green-500"
    },
    {
        role: "Élu / Maire",
        description: "iAsted supporte votre pilotage : tableaux de bord, statistiques, correspondance officielle, prises de décisions.",
        icon: Shield,
        color: "bg-purple-500"
    },
];

const springTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8
};

export default function IAstedGuidePage() {
    const [activeSection, setActiveSection] = useState("intro");

    const renderSectionContent = () => {
        switch (activeSection) {
            case "intro":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center max-w-3xl mx-auto">
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    boxShadow: [
                                        "0 10px 40px -10px rgba(139, 92, 246, 0.3)",
                                        "0 10px 60px -10px rgba(139, 92, 246, 0.5)",
                                        "0 10px 40px -10px rgba(139, 92, 246, 0.3)"
                                    ]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Headphones className="w-12 h-12 text-white" />
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Votre Assistant Vocal Municipal
                            </h2>
                            <p className="text-lg text-muted-foreground mb-6">
                                <strong>iAsted</strong> (Intelligent ASSistant for Territorial Electronic Democracy) est l'assistant vocal intelligent
                                du réseau des mairies du Gabon. Il vous guide dans toutes vos démarches
                                administratives grâce à la reconnaissance vocale et l'intelligence artificielle.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Badge variant="outline" className="py-2 px-4 text-sm">
                                    <Mic className="w-4 h-4 mr-2" /> Commandes Vocales
                                </Badge>
                                <Badge variant="outline" className="py-2 px-4 text-sm">
                                    <MessageSquare className="w-4 h-4 mr-2" /> Chat Intelligent
                                </Badge>
                                <Badge variant="outline" className="py-2 px-4 text-sm">
                                    <Zap className="w-4 h-4 mr-2" /> IA Avancée
                                </Badge>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 mt-12">
                            <Card className="neu-card border-0">
                                <CardHeader className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Mic className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <CardTitle>Parlez Naturellement</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center text-muted-foreground">
                                    Dites simplement ce que vous voulez faire. iAsted comprend le français naturel et les accents locaux.
                                </CardContent>
                            </Card>

                            <Card className="neu-card border-0">
                                <CardHeader className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Zap className="w-8 h-8 text-green-500" />
                                    </div>
                                    <CardTitle>Réponses Instantanées</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center text-muted-foreground">
                                    Obtenez des réponses immédiates et des actions automatiques sans naviguer dans les menus.
                                </CardContent>
                            </Card>

                            <Card className="neu-card border-0">
                                <CardHeader className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <Shield className="w-8 h-8 text-purple-500" />
                                    </div>
                                    <CardTitle>Sécurisé & Privé</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center text-muted-foreground">
                                    Vos conversations et données sont chiffrées et ne sont jamais partagées avec des tiers.
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                );

            case "capabilities":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center max-w-2xl mx-auto mb-8">
                            <h2 className="text-3xl font-bold mb-4">Tout ce qu'iAsted peut faire</h2>
                            <p className="text-muted-foreground">
                                Un assistant complet pour gérer tous les aspects de votre relation avec l'administration municipale.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {CAPABILITIES.map((cap, index) => (
                                <motion.div
                                    key={cap.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className="p-4 rounded-xl bg-card border hover:shadow-lg transition-all cursor-default"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg bg-muted ${cap.color}`}>
                                            <cap.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{cap.title}</h4>
                                            <p className="text-sm text-muted-foreground">{cap.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            case "commands":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center max-w-2xl mx-auto mb-8">
                            <h2 className="text-3xl font-bold mb-4">Exemples de Commandes</h2>
                            <p className="text-muted-foreground">
                                Parlez naturellement à iAsted. Voici quelques exemples de ce que vous pouvez dire.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            {VOICE_EXAMPLES.map((cmd, index) => (
                                <motion.div
                                    key={cmd.phrase}
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="p-4 rounded-xl bg-card border hover:border-violet-500/50 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <motion.div
                                            className="p-2 rounded-full bg-violet-500/10 shrink-0"
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                        >
                                            <Mic className="w-4 h-4 text-violet-500" />
                                        </motion.div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="text-[10px]">{cmd.category}</Badge>
                                            </div>
                                            <p className="font-medium text-sm">"{cmd.phrase}"</p>
                                            <p className="text-xs text-muted-foreground mt-1">→ {cmd.action}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-sm text-muted-foreground italic">
                                💡 Astuce : Dites "Guide-moi" pour obtenir de l'aide contextuelle sur n'importe quelle page.
                            </p>
                        </div>
                    </motion.div>
                );

            case "profiles":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center max-w-2xl mx-auto mb-8">
                            <h2 className="text-3xl font-bold mb-4">Adapté à Votre Profil</h2>
                            <p className="text-muted-foreground">
                                iAsted s'adapte automatiquement à votre rôle pour vous offrir une expérience personnalisée.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {USER_PROFILES.map((profile, index) => (
                                <motion.div
                                    key={profile.role}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.15 }}
                                    whileHover={{ y: -8 }}
                                    className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-lg"
                                >
                                    <div className={`absolute top-0 left-0 right-0 h-1 ${profile.color}`} />
                                    <div className={`w-14 h-14 rounded-xl ${profile.color} flex items-center justify-center mb-4`}>
                                        <profile.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{profile.role}</h3>
                                    <p className="text-sm text-muted-foreground">{profile.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            case "start":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8 text-center"
                    >
                        <div className="max-w-2xl mx-auto">
                            <motion.div
                                className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                animate={{
                                    scale: [1, 1.1, 1],
                                    boxShadow: [
                                        "0 10px 40px -10px rgba(16, 185, 129, 0.3)",
                                        "0 10px 60px -10px rgba(16, 185, 129, 0.5)",
                                        "0 10px 40px -10px rgba(16, 185, 129, 0.3)"
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <CheckCircle2 className="w-16 h-16 text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-bold mb-4">Prêt à Commencer ?</h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                Cliquez sur le bouton flottant <strong>iAsted</strong> en bas à droite de l'écran
                                pour lancer votre premier échange vocal.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <motion.div
                                    className="flex items-center gap-3 px-6 py-4 rounded-xl bg-violet-500/10 border border-violet-500/30"
                                    animate={{
                                        scale: [1, 1.02, 1],
                                        borderColor: ["rgba(139,92,246,0.3)", "rgba(139,92,246,0.6)", "rgba(139,92,246,0.3)"]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center">
                                        <Mic className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold">Bouton iAsted</p>
                                        <p className="text-xs text-muted-foreground">En bas à droite de l'écran</p>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="mt-12 flex flex-wrap justify-center gap-4">
                                <Link to="/register">
                                    <Button size="lg" className="gap-2">
                                        Créer un Compte <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button size="lg" variant="outline" className="gap-2">
                                        Se Connecter
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-12 md:py-20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
                    <div className="container mx-auto px-4 relative">
                        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                        </Link>

                        <div className="text-center mb-12">
                            <Badge className="mb-4 bg-violet-500/10 text-violet-600 border-violet-500/20">
                                Guide Interactif
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                Découvrez <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-600">iAsted</span>
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                L'assistant vocal intelligent qui révolutionne vos démarches administratives au Gabon.
                            </p>
                        </div>

                        {/* Section Navigation */}
                        <div className="flex flex-wrap justify-center gap-2 mb-12">
                            {GUIDE_SECTIONS.map((section) => (
                                <motion.button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeSection === section.id
                                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                                        : "bg-muted hover:bg-muted/80"
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
                                </motion.button>
                            ))}
                        </div>

                        {/* Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={springTransition}
                            >
                                {renderSectionContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
