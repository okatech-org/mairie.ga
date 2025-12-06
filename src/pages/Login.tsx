import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestTube2, Eye, EyeOff, ArrowRight, Landmark, Shield, ChevronRight, Building2, Mail, Key, Loader2, AlertCircle, Clock, MapPin, Sparkles, Users, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { PinCodeInput } from "@/components/auth/PinCodeInput";
import { toast } from "sonner";
import villeImage from "@/assets/ville-gabon.jpg";

export default function Login() {
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Email/Password form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // PIN form
  const [pinEmail, setPinEmail] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [activeTab, setActiveTab] = useState("email");

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard/citizen');
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard/citizen');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          setError("Email ou mot de passe incorrect");
        } else {
          setError(error.message);
        }
      } else {
        toast.success("Connexion réussie !");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call the edge function for secure PIN verification
      const { data, error: fnError } = await supabase.functions.invoke('auth-pin-login', {
        body: { email: pinEmail, pinCode: pinCode }
      });

      if (fnError) {
        setError("Erreur de connexion au serveur");
        setLoading(false);
        return;
      }

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data.authLink) {
        // Use the magic link to authenticate
        toast.success(`Bienvenue ${data.user.firstName} !`);
        
        // Redirect to the auth link which will sign in the user
        window.location.href = data.authLink;
      } else {
        setError("Erreur lors de l'authentification");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse min-h-[calc(100vh-200px)]">
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-8 md:py-12 px-4">
        <div className="w-full max-w-md">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6 md:mb-8 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Connexion</span>
          </div>

          <Card className="border-2">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Building2 className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold">Espace Citoyen</CardTitle>
              <CardDescription className="text-sm">
                Accédez à vos services municipaux en ligne
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="pin" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Code PIN
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    {error && activeTab === "email" && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Adresse email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="exemple@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 md:h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm">Mot de passe</Label>
                        <Link 
                          to="/forgot-password" 
                          className="text-xs md:text-sm text-primary hover:underline"
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
                          className="h-11 md:h-12 pr-12"
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

                    <Button className="w-full h-11 md:h-12 gap-2" size="lg" disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Accéder à mes services
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="pin">
                  <form onSubmit={handlePinLogin} className="space-y-6">
                    <div className="text-center text-sm text-muted-foreground">
                      Connexion rapide avec votre code PIN à 6 chiffres
                    </div>

                    {error && activeTab === "pin" && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="pin-email" className="text-sm">Adresse email</Label>
                      <Input
                        id="pin-email"
                        type="email"
                        placeholder="exemple@email.com"
                        value={pinEmail}
                        onChange={(e) => setPinEmail(e.target.value)}
                        required
                        className="h-11 md:h-12"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-center block text-sm">Code PIN</Label>
                      <PinCodeInput
                        value={pinCode}
                        onChange={setPinCode}
                        disabled={loading}
                      />
                    </div>

                    <Button 
                      className="w-full h-11 md:h-12 gap-2" 
                      size="lg" 
                      disabled={loading || pinCode.length !== 6}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Vérifier le code PIN
                          <Key className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Le code PIN vous a été fourni lors de votre inscription
                    </p>
                  </form>
                </TabsContent>
              </Tabs>

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
                  <Button variant="outline" className="w-full mt-4 h-11 md:h-12">
                    Créer mon compte citoyen
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
                      className="w-full mt-4 border-accent text-accent hover:bg-accent hover:text-accent-foreground h-11 md:h-12"
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
                  Vos données sont protégées selon les normes de sécurité gouvernementales
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img 
          src={villeImage} 
          alt="Ville gabonaise" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Theme-aware overlay like homepage */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/50 to-slate-900/30 dark:from-black/80 dark:via-black/60 dark:to-black/40" />

        <div className="relative z-10 flex items-center justify-center w-full px-8 xl:px-12">
          <div className="text-white max-w-lg">
            {/* Badge & Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-xl bg-white/20 dark:bg-primary/20 border border-white/30 dark:border-primary/30 flex items-center justify-center backdrop-blur-sm">
                <Landmark className="h-8 w-8 text-white dark:text-primary" />
              </div>
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-100 dark:text-success border border-emerald-500/30 dark:border-success/30 text-sm font-medium backdrop-blur-sm">
                🇬🇦 République Gabonaise
              </div>
            </div>

            <h2 className="text-3xl xl:text-4xl font-bold mb-2 drop-shadow-lg">
              <span className="text-white dark:text-primary">MAIRIE.GA</span>
            </h2>
            <p className="text-xl xl:text-2xl font-medium text-white/95 mb-6 drop-shadow-md">
              Le Portail des Communes du Gabon
            </p>
            <p className="text-white/80 text-base xl:text-lg mb-8 leading-relaxed">
              Accédez à vos services municipaux en ligne. État civil, urbanisme, 
              fiscalité locale — démarches simplifiées et sécurisées.
            </p>

            {/* Features Grid like homepage */}
            <div className="grid grid-cols-2 gap-3 xl:gap-4">
              {[
                { icon: Shield, title: "Sécurisé", desc: "Données protégées" },
                { icon: Clock, title: "24/7", desc: "Toujours disponible" },
                { icon: MapPin, title: "52 Communes", desc: "Réseau national" },
                { icon: Sparkles, title: "Simplifié", desc: "100% en ligne" }
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/20 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-white dark:text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{feature.title}</p>
                    <p className="text-xs text-white/70">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 xl:mt-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
              {[
                { value: "52", label: "Communes", icon: Landmark },
                { value: "2.3M", label: "Citoyens", icon: Users },
                { value: "100%", label: "Gratuit", icon: CheckCircle2 },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <stat.icon className="h-5 w-5 mx-auto mb-2 text-white/80" />
                  <div className="text-xl xl:text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Visual Banner */}
      <div className="lg:hidden relative overflow-hidden py-12 px-4 bg-gradient-to-br from-primary via-primary/90 to-secondary">
        <div className="text-white text-center max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Landmark className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            Votre Mairie en Ligne
          </h2>
          <p className="text-white/90 text-sm mb-6">
            Simplifiez vos démarches administratives
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            {[
              { value: "52", label: "Mairies" },
              { value: "1.8M", label: "Citoyens" },
              { value: "24/7", label: "Disponible" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-[10px] text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
