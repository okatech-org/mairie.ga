import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { ReactNode } from "react";

interface LogoutConfirmDialogProps {
  children: ReactNode;
}

export function LogoutConfirmDialog({ children }: LogoutConfirmDialogProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { clearSimulation } = useDemo();

  const handleLogout = async () => {
    await signOut();
    clearSimulation();
    navigate("/login");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            Confirmer la déconnexion
          </AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir vous déconnecter ? Vous serez redirigé vers la page de connexion.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleLogout}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Déconnexion
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
