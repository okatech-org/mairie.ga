import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Landmark, Menu, X, MapPin, FileText, Heart, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { GlobalSettings } from "@/components/GlobalSettings";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { LogoutConfirmDialog } from "@/components/auth/LogoutConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionTimer } from "@/components/auth/SessionTimer";

export const Header = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, currentEntity, isSimulating, clearSimulation } = useDemo();
  const { user: authUser, signOut, roleLabel } = useAuth();
  const navigate = useNavigate();

  const handleMobileMenuSignOut = () => {
    setMobileMenuOpen(false);
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
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="max-w-[120px] truncate">
                      {currentUser?.name || authUser.email?.split('@')[0] || 'Mon Espace'}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1.5">
                    <p className="text-sm font-medium leading-none">
                      {currentUser?.name || 'Utilisateur'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {authUser.email}
                    </p>
                    {roleLabel && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary w-fit">
                        {roleLabel}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/citizen')}>
                  <User className="mr-2 h-4 w-4" />
                  Tableau de bord
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <LogoutConfirmDialog>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </LogoutConfirmDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
              <Button variant="outline">{t('common.login')}</Button>
            </Link>
          )}

          <GlobalSettings />
          <SessionTimer />
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
                <LogoutConfirmDialog>
                  <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/50 hover:bg-destructive/10" onClick={handleMobileMenuSignOut}>
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </LogoutConfirmDialog>
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