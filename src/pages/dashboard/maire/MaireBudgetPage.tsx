import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaireBudgetPage() {
    return (
        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Budget Municipal
            </h1>
            <div className="grid gap-6">
                <Card className="neu-card border-none">
                    <CardHeader>
                        <CardTitle>Aperçu du Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Module de gestion financière en cours de développement.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
