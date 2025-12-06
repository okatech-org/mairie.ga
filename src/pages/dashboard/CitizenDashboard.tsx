import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_GABONAIS_CITIZENS } from "@/data/mock-citizens";
import { MOCK_CHILDREN } from "@/data/mock-children";
import { FileText, Plane, UserCheck, Stamp, Plus, TrendingUp, Building2, MapPin, ChevronRight } from "lucide-react";
import { QuickChildProfileModal } from "@/components/registration/QuickChildProfileModal";
import { useState } from "react";
import { MunicipalServicesList } from "@/components/services/MunicipalServicesList";
import { Link } from "react-router-dom";

export default function CitizenDashboard() {
    const user = MOCK_GABONAIS_CITIZENS[0]; // Simulate logged in user
    const [isChildModalOpen, setIsChildModalOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Bienvenue, {user.firstName}</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                        <p className="text-muted-foreground">
                            Dossier Consulaire : <span className="font-mono font-medium text-primary">{user.consulateFile}</span>
                        </p>
                        {/* Territorial Status Display */}
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                <Building2 className="w-3 h-3" />
                                Géré par: Consulat France
                            </Badge>
                            {/* Mocking the signaled status for demo purposes if needed, or dynamic based on user */}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="neu-raised gap-2">
                        <MapPin className="w-4 h-4" />
                        Signaler mon déplacement
                    </Button>
                    <Button className="neu-raised bg-primary text-primary-foreground hover:shadow-neo-md transition-all border-none">
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Demande
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="neu-raised p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <UserCheck size={20} />
                        </div>
                        <div className="flex items-center gap-1 text-success text-sm font-medium">
                            <TrendingUp size={14} />
                            Actif
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">Statut du Dossier</p>
                    <h3 className="text-2xl font-bold text-foreground">Vérifié</h3>
                    <p className="text-xs text-muted-foreground mt-2">Mis à jour le {user.updatedAt.toLocaleDateString()}</p>
                </div>

                <div className="neu-raised p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                            <FileText size={20} />
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">Demandes en cours</p>
                    <h3 className="text-2xl font-bold text-foreground">1</h3>
                    <p className="text-xs text-muted-foreground mt-2">Renouvellement Passeport</p>
                </div>

                <div className="neu-raised p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600">
                            <Stamp size={20} />
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">Documents Disponibles</p>
                    <h3 className="text-2xl font-bold text-foreground">3</h3>
                    <p className="text-xs text-muted-foreground mt-2">Carte Consulaire, Actes...</p>
                </div>
            </div>

            <div className="neu-inset p-6 rounded-2xl mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Mes Enfants</h2>
                    <Button variant="outline" size="sm" onClick={() => setIsChildModalOpen(true)} className="neu-raised border-none hover:shadow-neo-md">
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un enfant
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {MOCK_CHILDREN.map((child) => (
                        <div key={child.id} className="neu-raised p-5 rounded-xl hover:shadow-neo-lg transition-all cursor-pointer bg-card">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold">{child.personal.firstName} {child.personal.lastName}</h3>
                                <Badge variant={child.status === 'ACTIVE' ? 'default' : 'secondary'} className="rounded-full">
                                    {child.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">Né(e) le {child.personal.birthDate?.toLocaleDateString()}</p>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <UserCheck className="h-4 w-4" />
                                {child.parents.length} Parent(s) lié(s)
                            </div>
                            <Button className="w-full neu-inset bg-transparent hover:bg-muted text-primary border-none shadow-none" size="sm">
                                Gérer le profil
                            </Button>
                        </div>
                    ))}

                    {MOCK_CHILDREN.length === 0 && (
                        <div className="col-span-3 text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                            Aucun enfant enregistré pour le moment.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Services Municipaux Disponibles</h2>
                <Link to="/services">
                    <Button variant="ghost" size="sm" className="gap-1">
                        Voir tout
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
            <MunicipalServicesList maxItems={6} showSearch={false} />

            <QuickChildProfileModal
                open={isChildModalOpen}
                onOpenChange={setIsChildModalOpen}
                residenceCountry={user.currentAddress.country}
                onSuccess={(childId) => {
                    // In a real app, we would refresh the list here
                    console.log("Child created:", childId);
                }}
            />
        </>
    );
}
