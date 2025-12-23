import { UnifiedRegistrationForm } from "@/components/auth/UnifiedRegistrationForm";

export default function RegisterPage() {
    return (
        <div className="container py-12 md:py-20 bg-dot-pattern">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                    Mairie Digitale du Gabon
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                    Votre Espace Usager Unique
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                    Créez votre compte en quelques minutes et accédez à l'ensemble des services publics municipaux et consulaires.
                </p>
            </div>
            <UnifiedRegistrationForm />
        </div>
    );
}
