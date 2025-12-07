import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaireArretesPage() {
    return (
        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Arrêtés Municipaux
            </h1>
            <div className="grid gap-6">
                <Card className="neu-card border-none">
                    <CardHeader>
                        <CardTitle>Gestion des Arrêtés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Module de gestion des arrêtés en cours de développement.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
