/**
 * LIMBIC SYSTEM - Supabase Auth Adapter
 * 
 * Implements IAuthGateway using Supabase as the backend.
 * This is the ONLY place Supabase auth logic should live.
 */

import { supabase } from '@/integrations/supabase/client';
import { IAuthGateway, RegisterUserInput, AuthResult, LoginCredentials } from '../../Cortex/ports/IAuthGateway';

export class SupabaseAuthAdapter implements IAuthGateway {

    async register(input: RegisterUserInput): Promise<AuthResult> {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
                data: {
                    first_name: input.firstName,
                    last_name: input.lastName,
                }
            }
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error('Erreur lors de la création du compte');

        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update profile with additional data
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                phone: input.phone || null,
                nationality: input.nationality || null,
                date_of_birth: input.dateOfBirth || null,
                pin_code: input.pinCode,
                pin_enabled: true,
            })
            .eq('user_id', authData.user.id);

        if (profileError) {
            console.error('Profile update error:', profileError);
        }

        // Assign citizen role
        await supabase
            .from('user_roles')
            .insert({ user_id: authData.user.id, role: 'citizen' });

        return {
            userId: authData.user.id,
            email: authData.user.email || input.email,
            sessionToken: authData.session?.access_token,
            isNewUser: true
        };
    }

    async loginWithPassword(credentials: LoginCredentials): Promise<AuthResult> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password!,
        });

        if (error) throw new Error(error.message);

        return {
            userId: data.user.id,
            email: data.user.email || credentials.email,
            sessionToken: data.session?.access_token,
            isNewUser: false
        };
    }

    async loginWithPin(credentials: LoginCredentials): Promise<AuthResult> {
        const { data, error } = await supabase.functions.invoke('auth-pin-login', {
            body: { email: credentials.email, pinCode: credentials.pinCode }
        });

        if (error) throw new Error('Erreur de connexion au serveur');
        if (data.error) throw new Error(data.error);

        return {
            userId: data.userId,
            email: credentials.email,
            sessionToken: data.accessToken,
            isNewUser: false
        };
    }

    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    }

    async getCurrentUser(): Promise<{ userId: string; email: string } | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return { userId: user.id, email: user.email || '' };
    }

    async isAuthenticated(): Promise<boolean> {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    }
}

// Singleton instance for convenience
export const supabaseAuthAdapter = new SupabaseAuthAdapter();
