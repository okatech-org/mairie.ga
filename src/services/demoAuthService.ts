/**
 * Demo Authentication Service
 * 
 * Handles one-click login for demo accounts using Supabase Auth.
 * Each demo user has a generated email and a standard demo password.
 */

import { supabase } from '@/integrations/supabase/client';
import { DemoUser } from '@/types/roles';

// Standard demo password for all demo accounts
const DEMO_PASSWORD = 'DemoGabon2025!';

// Generate a deterministic email from user ID
export const getDemoEmail = (userId: string): string => {
  // Sanitize the ID to create a valid email
  const sanitized = userId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  return `${sanitized}@demo.mairie.ga`;
};

// Create or get demo user in Supabase
export const ensureDemoUserExists = async (user: DemoUser): Promise<{ email: string; password: string } | null> => {
  const email = getDemoEmail(user.id);
  
  try {
    // Try to sign up the demo user (will fail if already exists, which is fine)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: DEMO_PASSWORD,
      options: {
        data: {
          first_name: user.name.split(' ')[0],
          last_name: user.name.split(' ').slice(1).join(' ') || user.name,
          demo_user_id: user.id,
          role: user.role,
          entity_id: user.entityId,
        },
        emailRedirectTo: `${window.location.origin}/dashboard/citizen`
      }
    });

    // If user already exists, that's fine - we can just log them in
    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('Error creating demo user:', signUpError);
    }

    return { email, password: DEMO_PASSWORD };
  } catch (error) {
    console.error('Error in ensureDemoUserExists:', error);
    return null;
  }
};

// One-click login for demo user
export const loginDemoUser = async (user: DemoUser): Promise<{ success: boolean; error?: string }> => {
  const email = getDemoEmail(user.id);

  try {
    // First, try to sign in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: DEMO_PASSWORD,
    });

    if (signInError) {
      // If user doesn't exist, create them first
      if (signInError.message.includes('Invalid login credentials')) {
        // Try to create the account
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: DEMO_PASSWORD,
          options: {
            data: {
              first_name: user.name.split(' ')[0],
              last_name: user.name.split(' ').slice(1).join(' ') || user.name,
              demo_user_id: user.id,
              role: user.role,
              entity_id: user.entityId,
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (signUpError) {
          console.error('Error creating demo account:', signUpError);
          return { success: false, error: 'Impossible de créer le compte démo' };
        }

        // Try to sign in again after creating
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: DEMO_PASSWORD,
        });

        if (retryError) {
          // If email confirmation is required
          if (retryError.message.includes('Email not confirmed')) {
            return { 
              success: false, 
              error: 'Compte créé. Veuillez désactiver "Confirm email" dans Supabase Auth Settings pour la démo.' 
            };
          }
          return { success: false, error: retryError.message };
        }
      } else if (signInError.message.includes('Email not confirmed')) {
        return { 
          success: false, 
          error: 'Email non confirmé. Désactivez "Confirm email" dans les paramètres Auth.' 
        };
      } else {
        return { success: false, error: signInError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Demo login error:', error);
    return { success: false, error: error.message || 'Erreur de connexion' };
  }
};

// Get demo credentials for display
export const getDemoCredentials = (userId: string): { email: string; password: string } => {
  return {
    email: getDemoEmail(userId),
    password: DEMO_PASSWORD,
  };
};
