import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Landmark, Menu, X, MapPin, FileText, Heart, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { GlobalSettings } from "@/components/GlobalSettings";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, currentEntity, isSimulating } = useDemo();
  const { user: authUser, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className={`sticky z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm ${isSimulating ? 'top-[60px]' : 'top-0'}`}>
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Landmark className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight text-foreground">{t('header.title')}</span>
            <span className="text-xs text-muted-foreground">
              {isSimulating && currentEntity ? (
                <span className="flex items-center gap-1">
                  🇬🇦 {currentEntity.metadata?.city || currentEntity.name}
                </span>
              ) : (
                t('header.subtitleNormal')
              )}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/services" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Services
          </Link>
          <Link to="/sensibilisation" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <Heart className="h-4 w-4" />
            Sensibilisation
          </Link>
          <Link to="/actualites" className="text-sm font-medium hover:text-primary transition-colors">
            {t('header.news')}
          </Link>

          {isSimulating && currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm">
              <span>{currentUser.badge}</span>
              <span className="font-medium">{currentUser.role}</span>
            </div>
          )}

          {authUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  Mon Espace
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/citizen')}>
                  <User className="mr-2 h-4 w-4" />
                  Tableau de bord
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
              <Button variant="outline">{t('common.login')}</Button>
            </Link>
          )}

          <GlobalSettings />
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-sm">
          <nav className="container mx-auto py-4 flex flex-col gap-4">
            {isSimulating && currentUser && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg text-sm">
                <span>{currentUser.badge}</span>
                <span className="font-medium">{currentUser.role}</span>
                {currentEntity && (
                  <span className="text-xs text-muted-foreground">
                    - 🇬🇦 {currentEntity.metadata?.city || currentEntity.name}
                  </span>
                )}
              </div>
            )}
            <Link
              to="/services"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText className="h-4 w-4" />
              Services
            </Link>
            <Link
              to="/sensibilisation"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="h-4 w-4" />
              Sensibilisation
            </Link>
            <Link
              to="/actualites"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('header.news')}
            </Link>
            <Link
              to="/demo-portal"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('header.demoPortal')}
            </Link>
            {isSimulating && currentUser?.role === "ADMIN" && (
              <Link
                to="/admin"
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Landmark className="h-4 w-4" />
                {t('header.admin')}
              </Link>
            )}

            {authUser ? (
              <>
                <Link to="/dashboard/citizen" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full gap-2">
                    <User className="h-4 w-4" />
                    Mon Tableau de bord
                  </Button>
                </Link>
                <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  {t('common.login')}
                </Button>
              </Link>
            )}

            <div className="flex justify-center gap-2 pt-4 border-t border-border/40">
              <GlobalSettings />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};