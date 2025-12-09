import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { getDashboardRouteByRole, roleLabels } from "@/utils/role-routing";
import { useDemo } from "@/contexts/DemoContext";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<AppRole | null>(null);
    const [roleLabel, setRoleLabel] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { clearSimulation } = useDemo();

    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .maybeSingle();

            if (error) {
                console.error("Error fetching user role:", error);
                return;
            }

            if (data?.role) {
                setUserRole(data.role);
                setRoleLabel(roleLabels[data.role]);
            }
        } catch (err) {
            console.error("Error in fetchUserRole:", err);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (session?.user) {
                setTimeout(() => {
                    fetchUserRole(session.user.id);
                }, 0);
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (session?.user) {
                setTimeout(() => {
                    fetchUserRole(session.user.id);
                }, 0);
            } else {
                setUserRole(null);
                setRoleLabel(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        clearSimulation(); // Clear demo simulation on logout
        await supabase.auth.signOut();
        setUserRole(null);
        setRoleLabel(null);
    };

    return {
        session,
        user,
        userRole,
        roleLabel,
        loading,
        signOut,
        getDashboardRoute: () => getDashboardRouteByRole(userRole),
    };
}