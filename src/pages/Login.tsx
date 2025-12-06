import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, TestTube2, Eye, EyeOff, ArrowRight, Landmark, Shield, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Login() {
  const isDev = import.meta.env.DEV;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm mb-8 text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Connexion</span>
            </div>

            <Card className="border-2">
              <CardHeader className="space-y-1 text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Landmark className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
                <CardDescription>
                  Accédez à votre espace consulaire sécurisé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemple@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-sm text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Se souvenir de moi
                    </label>
                  </div>

                  <Button className="w-full h-12 gap-2" size="lg">
                    Se connecter
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Pas encore inscrit ?
                      </span>
                    </div>
                  </div>

                  <Link to="/register">
                    <Button variant="outline" className="w-full mt-4 h-12">
                      Créer un compte
                    </Button>
                  </Link>
                </div>

                {isDev && (
                  <>
                    <Separator className="my-6" />
                    
                    <Alert className="bg-accent/10 border-accent">
                      <TestTube2 className="h-4 w-4 text-accent" />
                      <AlertDescription className="text-sm">
                        Mode développement - Accès rapide disponible
                      </AlertDescription>
                    </Alert>

                    <Link to="/demo-portal">
                      <Button
                        variant="outline"
                        className="w-full mt-4 border-accent text-accent hover:bg-accent hover:text-accent-foreground h-12"
                      >
                        <TestTube2 className="mr-2 h-4 w-4" />
                        Accès Démo Rapide
                      </Button>
                    </Link>
                  </>
                )}

                <Alert className="mt-6 bg-muted/50">
                  <Shield className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs">
                    Vos données sont protégées et chiffrées selon les normes gouvernementales
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/90 via-primary to-secondary/90 items-center justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative z-10 text-white text-center px-12 max-w-lg">
            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Landmark className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Bienvenue sur e-Gabon
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Votre portail unique pour toutes vos démarches consulaires et administratives
            </p>
            <div className="grid grid-cols-2 gap-4 text-left">
              {[
                "Services en ligne 24/7",
                "Suivi en temps réel",
                "Documents sécurisés",
                "Support multilingue"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-white/5 blur-3xl" />
        </div>
      </div>

      <Footer />
    </div>
  );
}
