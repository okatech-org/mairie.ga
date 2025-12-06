import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestTube2, Eye, EyeOff, ArrowRight, Landmark, Shield, ChevronRight, Building2, Mail, Key, Loader2, AlertCircle } from "lucide-react";
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
      // First verify the PIN code
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, pin_code, pin_enabled, first_name, last_name')
        .eq('email', pinEmail)
        .eq('pin_enabled', true)
        .maybeSingle();

      if (profileError) {
        setError("Erreur lors de la vérification");
        setLoading(false);
        return;
      }

      if (!profiles) {
        setError("Email non trouvé ou code PIN non activé");
        setLoading(false);
        return;
      }

      if (profiles.pin_code !== pinCode) {
        setError("Code PIN incorrect");
        setLoading(false);
        return;
      }

      // PIN is correct - switch to email/password with email pre-filled
      toast.success(`Bienvenue ${profiles.first_name} ! Entrez votre mot de passe pour continuer.`);
      setEmail(pinEmail);
      setActiveTab("email");
      setPinCode("");
      
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
      {/* Left Side - Form */}
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

      {/* Right Side - Visual */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img 
          src={villeImage} 
          alt="Ville gabonaise" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/90" />

        <div className="relative z-10 flex items-center justify-center w-full px-8 xl:px-12">
          <div className="text-white text-center max-w-lg">
            <div className="w-20 h-20 xl:w-24 xl:h-24 mx-auto mb-6 xl:mb-8 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Landmark className="h-10 w-10 xl:h-12 xl:w-12" />
            </div>
            <h2 className="text-2xl xl:text-3xl font-bold mb-4">
              Votre Mairie en Ligne
            </h2>
            <p className="text-white/90 text-base xl:text-lg mb-6 xl:mb-8">
              Simplifiez vos démarches administratives avec le portail citoyen des mairies du Gabon
            </p>
            <div className="grid grid-cols-2 gap-3 xl:gap-4 text-left">
              {[
                "État civil en ligne",
                "Suivi des demandes",
                "Urbanisme simplifié",
                "Prise de rendez-vous"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 xl:mt-12 grid grid-cols-3 gap-4 pt-6 xl:pt-8 border-t border-white/20">
              {[
                { value: "52", label: "Mairies" },
                { value: "1.8M", label: "Citoyens" },
                { value: "24/7", label: "Disponible" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
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
