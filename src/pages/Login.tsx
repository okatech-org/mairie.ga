import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, TestTube2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const isDev = import.meta.env.DEV;

  return (
    <div className="flex-1 flex items-center justify-center py-12 bg-gradient-official">
      <div className="container max-w-md">
        <Card className="animate-scale-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Accédez à votre espace consulaire sécurisé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <Button className="w-full" size="lg">
              Se connecter
            </Button>

            {isDev && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Mode Développement
                    </span>
                  </div>
                </div>

                <Alert className="bg-accent/10 border-accent">
                  <TestTube2 className="h-4 w-4" />
                  <AlertDescription>
                    Accès rapide au portail de démonstration disponible
                  </AlertDescription>
                </Alert>

                <Link to="/demo-portal">
                  <Button
                    variant="outline"
                    className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    size="lg"
                  >
                    <TestTube2 className="mr-2 h-4 w-4" />
                    Accès Rapide (Mode Démo)
                  </Button>
                </Link>
              </>
            )}

            <div className="text-center text-sm">
              <a href="#" className="text-primary hover:underline">
                Mot de passe oublié ?
              </a>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vos données sont protégées et chiffrées selon les normes gouvernementales
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
