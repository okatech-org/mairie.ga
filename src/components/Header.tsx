import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Landmark, Menu, X, MapPin, FileText, Heart, LogOut, User, TestTube2, XCircle, Brain } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { GlobalSettings } from "@/components/GlobalSettings";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { LogoutConfirmDialog } from "@/components/auth/LogoutConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
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
          <DropdownMenu>
            <DropdownMenuTrigger className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Landmark className="h-4 w-4" />
              Documents officiels
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link to="/arretes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Arrêtés municipaux
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/deliberations" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Délibérations
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/sensibilisation" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <Heart className="h-4 w-4" />
            Sensibilisation
          </Link>
          <Link to="/recherche-kb" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <Brain className="h-4 w-4" />
            Base de connaissances
          </Link>
          <Link to="/actualites" className="text-sm font-medium hover:text-primary transition-colors">
            {t('header.news')}
          </Link>

          <AnimatePresence mode="wait">
            {isSimulating && currentUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25,
                  duration: 0.3 
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer group">
                      <Badge 
                        variant="outline" 
                        className="bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                      >
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <TestTube2 className="h-3.5 w-3.5 mr-1.5" />
                        </motion.div>
                        <span className="font-medium">DÉMO</span>
                        <span className="mx-1.5 text-amber-500/50">|</span>
                        <span>{currentUser.badge}</span>
                        <span className="ml-1">{currentUser.name}</span>
                      </Badge>
                      <motion.button 
                        onClick={clearSimulation}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-full"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </motion.button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="text-sm">
                      <p className="font-medium">Mode Démonstration Actif</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Rôle: {currentUser.role}
                        {currentEntity && ` • ${currentEntity.metadata?.city || currentEntity.name}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Cliquez sur ✕ pour quitter</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>

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
            <AnimatePresence mode="wait">
              {isSimulating && currentUser && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <TestTube2 className="h-4 w-4 text-amber-600" />
                      </motion.div>
                      <span className="font-medium text-amber-700 dark:text-amber-400">DÉMO</span>
                      <span className="text-amber-600">{currentUser.badge}</span>
                      <span className="font-medium">{currentUser.name}</span>
                      {currentEntity && (
                        <span className="text-xs text-muted-foreground">
                          • 🇬🇦 {currentEntity.metadata?.city || currentEntity.name}
                        </span>
                      )}
                    </div>
                    <motion.button 
                      onClick={() => { clearSimulation(); setMobileMenuOpen(false); }}
                      className="p-1 hover:bg-destructive/10 rounded-full"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              to="/recherche-kb"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Brain className="h-4 w-4" />
              Base de connaissances
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